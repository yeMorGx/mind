import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.3";

const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const allowedOrigins = new Set(["https://mind-lemon.vercel.app", "http://localhost:3000"]);
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
function image(value: unknown) {
  return typeof value === "string" && value.length <= 80000 && /^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(value) ? value : "";
}

Deno.serve(async request => {
  const origin = request.headers.get("origin");
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://mind-lemon.vercel.app",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
  const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
  if (origin && !allowedOrigins.has(origin)) return reply({ error: "Origem não permitida." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply({ error: "Método não permitido." }, 405);
  // The gateway check is disabled because this is a Firebase JWT, not a Supabase
  // JWT. Every write below requires its RS256 signature, issuer, audience and expiry.
  let uid: string;
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new Error("Missing token");
    const { payload } = await jwtVerify(token, keys, { algorithms: ["RS256"], issuer: "https://securetoken.google.com/mind-a9499", audience: "mind-a9499", requiredClaims: ["exp", "iat", "sub"], clockTolerance: 5 });
    if (!payload.sub || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub)) throw new Error("Invalid subject");
    uid = payload.sub;
  } catch { return reply({ error: "Entre novamente na conta para atualizar o perfil." }, 401); }
  try {
    const raw = await request.text();
    if (raw.length > 200000) return reply({ error: "Perfil muito grande." }, 413);
    const body = JSON.parse(raw);
    const source = body.profile;
    if (!source || typeof source !== "object" || Array.isArray(source)) return reply({ error: "Perfil inválido." }, 400);
    const profile = { name: String(source.name ?? "").trim(), bio: String(source.bio ?? "").trim(), headline: String(source.headline ?? "").trim(), avatarUrl: image(source.avatarUrl), bannerUrl: image(source.bannerUrl) };
    if (!profile.name || profile.name.length > 80 || profile.bio.length > 1000 || profile.headline.length > 100) return reply({ error: "Confira o nome, a apresentação e a bio." }, 400);
    const migrated = await admin.from("mind_creators").select("profile").eq("public_id", uid).maybeSingle();
    if (migrated.error) throw migrated.error;
    if (migrated.data) return body.ensure === true ? reply({ profile: migrated.data.profile }) : reply({ error: "Sua conta já foi migrada. Conclua o login Google para editar o perfil." }, 409);
    if (body.ensure === true) {
      const { error } = await admin.from("mind_creator_directory").upsert({ public_id: uid, profile }, { onConflict: "public_id", ignoreDuplicates: true });
      if (error) throw error;
    } else {
      const { error } = await admin.from("mind_creator_directory").upsert({ public_id: uid, profile, updated_at: new Date().toISOString() });
      if (error) throw error;
    }
    return reply({ saved: true });
  } catch { return reply({ error: "Não foi possível atualizar o perfil. Tente novamente." }, 500); }
});
