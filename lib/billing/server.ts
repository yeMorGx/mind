import "server-only";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Cadence, PaidPlan } from "./plans";

export class ServiceError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function adminClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new ServiceError("Este serviço está em preparação. Tente novamente mais tarde.", 503);
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function stripeClient() {
 if (!process.env.STRIPE_SECRET_KEY) throw new ServiceError("As assinaturas ainda estão em preparação.", 503);
 return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 15000 });
}
export const siteUrl = () => "https://mind-lemon.vercel.app";
export function assertOrigin(request: Request) {
 const origin = request.headers.get("origin");
 const allowed = new Set([siteUrl(), ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : [])]);
 if (!origin || !allowed.has(origin)) throw new ServiceError("Origem da solicitação não permitida.", 403);
}
export async function readBody(request: Request, max = 12000) {
 if (Number(request.headers.get("content-length") || 0) > max) throw new ServiceError("A mensagem ultrapassa o limite permitido.", 413);
 if (!request.headers.get("content-type")?.includes("application/json")) throw new ServiceError("Envie os dados do formulário.", 415);
 // Read incrementally so an untrusted body cannot allocate unbounded memory.
 const reader = request.body?.getReader();
 if (!reader) throw new ServiceError("Confira os dados enviados.");
 let size = 0; const chunks: Uint8Array[] = [];
 while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > max) { await reader.cancel(); throw new ServiceError("A mensagem ultrapassa o limite permitido.", 413); } chunks.push(part.value); }
 const buffer = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
 try { const value = JSON.parse(new TextDecoder().decode(buffer)); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); return value as Record<string, unknown>; }
 catch { throw new ServiceError("Confira os dados enviados."); }
}
const firebaseKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
export async function identity(request: Request) {
 const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if (!token || token.length > 16000) throw new ServiceError("Entre na sua conta para continuar.", 401);
 const backend = request.headers.get("x-mind-backend");
 const admin = adminClient();
 let actor: string;
 if (backend === "firebase") {
  let sub: string | undefined;
  try { const verified = await jwtVerify(token, firebaseKeys, { algorithms: ["RS256"], issuer: "https://securetoken.google.com/mind-a9499", audience: "mind-a9499", requiredClaims: ["exp", "iat", "sub"], clockTolerance: 5 }); sub = verified.payload.sub; }
  catch { throw new ServiceError("Sua sessão expirou. Entre novamente.", 401); }
  if (!sub || !/^[A-Za-z0-9_-]{1,128}$/.test(sub)) throw new ServiceError("Entre novamente na sua conta.", 401);
  actor = sub;
  const migrated = await admin.from("mind_accounts").select("public_id").eq("public_id", actor).maybeSingle();
  if (migrated.error) throw new ServiceError("Não foi possível confirmar a conta.", 503);
  if (migrated.data) throw new ServiceError("Renove o login Google para usar sua conta atualizada.", 401);
 } else if (backend === "supabase") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const user = await client.auth.getUser(token);
  if (user.error || !user.data.user) throw new ServiceError("Sua sessão expirou. Entre novamente.", 401);
  const account = await client.rpc("mind_billing_session");
  if (account.error || !account.data) throw new ServiceError("Confirme o login e o autenticador, se estiver ativado.", 403);
  actor = account.data;
 } else throw new ServiceError("Entre novamente para confirmar sua sessão.", 401);
 const chosen = await admin.from("mind_usernames").select("username").eq("public_id", actor).maybeSingle();
 if (chosen.error) throw new ServiceError("Não foi possível conferir a conta.", 503);
 if (!chosen.data) throw new ServiceError("Escolha seu @ para continuar.", 403);
 return { actor, admin };
}
export async function isOwner(actor: string) {
 const admin = adminClient();
 const [native, legacy] = await Promise.all([admin.from("mind_badges").select("badges").eq("public_id", actor).maybeSingle(), admin.from("mind_creator_directory").select("badges").eq("public_id", actor).maybeSingle()]);
 if (native.error || legacy.error) throw new ServiceError("Não foi possível conferir o acesso administrativo.", 503);
 return (native.data?.badges || []).includes("owner") || (legacy.data?.badges || []).includes("owner");
}
export function priceId(plan: PaidPlan, cadence: Cadence) {
 const value = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_${cadence.toUpperCase()}`];
 if (!value?.startsWith("price_")) throw new ServiceError("Este plano ainda não está disponível para assinatura.", 503);
 return value;
}
export async function billingEnabled() {
 const { data, error } = await adminClient().from("mind_billing_settings").select("enabled").eq("id", true).single();
 if (error) throw new ServiceError("As assinaturas ainda estão em preparação.", 503);
 return data.enabled === true;
}
export function apiError(error: unknown) {
 if (error instanceof ServiceError) return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
 console.error("Mind service failure", error instanceof Error ? error.name : "DatabaseError");
 return Response.json({ error: "Não foi possível concluir. Tente novamente em alguns instantes." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
export const noStore = { "Cache-Control": "private, no-store, max-age=0", Vary: "Authorization, X-Mind-Backend" };
export function databaseError(error: { message: string } | null) {
 if (!error) return;
 const allowed = /^(Seu plano permite|Muitas mensagens|Já há um checkout|Gerencie sua assinatura|Este prompt não está público|Publique o prompt|Escolha uma opção)/;
 throw new ServiceError(allowed.test(error.message) ? error.message : "Não foi possível concluir esta ação. Tente novamente.", allowed.test(error.message) ? 409 : 503);
}
