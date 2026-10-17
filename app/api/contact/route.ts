import { createHmac } from "node:crypto";
import { adminClient, apiError, assertOrigin, databaseError, readBody, ServiceError } from "@/lib/billing/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
 let available = false;
 if (process.env.CONTACT_FORMS_ENABLED === "true") {
  try { const { error } = await adminClient().from("mind_inquiries").select("id").limit(0); available = !error; } catch { /* No false success while storage is unavailable. */ }
 }
 return Response.json({ available }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
 try {
  assertOrigin(request);
  if (process.env.CONTACT_FORMS_ENABLED !== "true") throw new ServiceError("O formulário está em preparação. Tente novamente mais tarde.", 503);
  const body = await readBody(request, 30000);
  const text = (key: string, max: number, min = 0) => { const value = typeof body[key] === "string" ? body[key].trim() : ""; if (value.length < min || value.length > max) throw new ServiceError("Confira os campos e o tamanho da mensagem."); return value; };
  if (text("extra", 200)) throw new ServiceError("Não foi possível enviar este formulário.");
  const email = text("email", 254, 3).toLowerCase(), website = text("website", 2048);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ServiceError("Informe um e-mail válido.");
  if (website) { try { const value = new URL(website); if (value.protocol !== "https:" || value.username || value.password) throw new Error(); } catch { throw new ServiceError("Informe um link HTTPS válido para o portfólio ou site."); } }
  if (body.kind !== "careers" && body.kind !== "business") throw new ServiceError("Escolha o tipo de contato.");
  if (body.consent !== true) throw new ServiceError("Autorize o uso dos dados para responder à sua mensagem.");
  const payload = { kind: body.kind, name: text("name", 100, 2), email, organization: text("organization", 160), subject: text("subject", 120, 2), website, budget: text("budget", 80), message: text("message", 5000, 20), consent: true };
  const client = adminClient();
  const ip = request.headers.get("x-real-ip") || "unavailable";
  const fingerprint = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!).update(ip).digest("hex");
  const result = await client.rpc("mind_submit_inquiry", { payload, fingerprint }); databaseError(result.error);
  return Response.json({ received: true, id: result.data }, { status: 201, headers: { "Cache-Control": "no-store" } });
 } catch (error) { return apiError(error); }
}
