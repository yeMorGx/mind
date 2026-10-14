import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.3";

const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const origins = new Set(["https://mind-lemon.vercel.app", "http://localhost:3000"]);
const root = "https://firestore.googleapis.com/v1/projects/mind-a9499/databases/(default)/documents";
type FireValue = { stringValue?: string; booleanValue?: boolean; timestampValue?: string; arrayValue?: { values?: FireValue[] }; mapValue?: { fields?: Record<string, FireValue> } };
function decode(value: FireValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue) return Date.parse(value.timestampValue);
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decode);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, decode(item)]));
  return null;
}
class PublicationError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function firestore(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${root}/${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new PublicationError(response.status === 403 ? "Sua conta não pode alterar este prompt." : response.status === 404 ? "Prompt não encontrado." : "Não foi possível acessar sua biblioteca. Tente novamente.", response.status === 403 ? 403 : response.status === 404 ? 404 : 502);
  return await response.json();
}
Deno.serve(async request => {
  const origin = request.headers.get("origin");
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin && origins.has(origin) ? origin : "https://mind-lemon.vercel.app", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !origins.has(origin)) return reply({ error: "Origem não permitida." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply({ error: "Método não permitido." }, 405);
  // The platform's Supabase-only JWT check is disabled. Firebase's signature,
  // audience, issuer and expiry are verified here before database access.
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  let uid: string;
  try {
    if (!token) throw new Error();
    const { payload } = await jwtVerify(token, keys, { algorithms: ["RS256"], issuer: "https://securetoken.google.com/mind-a9499", audience: "mind-a9499", requiredClaims: ["exp", "iat", "sub"], clockTolerance: 5 });
    if (!payload.sub || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub)) throw new Error();
    uid = payload.sub;
  } catch { return reply({ error: "Entre novamente na conta para publicar o prompt." }, 401); }
  try {
    const raw = await request.text();
    if (raw.length > 1000) return reply({ error: "Solicitação inválida." }, 400);
    const body = JSON.parse(raw);
    const { workspaceId, promptId, published } = body;
    if (![workspaceId, promptId].every(value => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value)) || typeof published !== "boolean") return reply({ error: "Solicitação inválida." }, 400);
    const migrated = await admin.from("mind_accounts").select("public_id").eq("public_id", uid).maybeSingle();
    if (migrated.error) throw migrated.error;
    if (migrated.data) return reply({ error: "Sua conta já foi migrada. Entre com Google para publicar." }, 409);
    // Fetch original records with the owner's Firebase token. Firestore rules
    // still apply, and we also check ownerId. Client snapshots are never accepted.
    const workspace = await firestore(`workspaces/${workspaceId}`, token!);
    if (workspace.fields?.ownerId?.stringValue !== uid) return reply({ error: "Este prompt pertence a outra conta." }, 403);
    const path = `workspaces/${workspaceId}/prompts/${promptId}`;
    const source = await firestore(path, token!);
    const record = Object.fromEntries(Object.entries(source.fields ?? {}).map(([key, value]) => [key, decode(value as FireValue)]));
    if (record.createdBy !== uid) return reply({ error: "Este prompt pertence a outra conta." }, 403);
    const flagPath = `${path}?updateMask.fieldPaths=isPublished&currentDocument.updateTime=${encodeURIComponent(source.updateTime)}`;
    const setFlag = (value: boolean, target = flagPath) => firestore(target, token!, { method: "PATCH", body: JSON.stringify({ fields: { isPublished: { booleanValue: value } } }) });
    if (!published) {
      // Remove public access first. A failed private flag update is retryable;
      // never put a public snapshot back after an unpublish request.
      const { error } = await admin.from("mind_directory_prompts").delete().eq("creator_id", uid).eq("prompt_id", promptId);
      if (error) throw error;
      await setFlag(false);
      return reply({ published: false });
    }
    const title = String(record.title ?? "").trim(), content = String(record.content ?? "").trim();
    if (!title || title.length > 120 || !content || content.length > 20000) return reply({ error: "Confira o título e o conteúdo antes de publicar." }, 400);
    const roles = new Set(["gallery", "reference", "before", "after"]);
    const images = (Array.isArray(record.images) ? record.images : []).map((item: Record<string, unknown>) => {
      if (!item || typeof item.url !== "string" || item.url.length > 80000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(item.url) || !roles.has(String(item.role))) throw new PublicationError("Confira as imagens antes de publicar.", 400);
      return { id: String(item.id).slice(0,128), url: item.url, label: String(item.label ?? "").slice(0,120), role: item.role };
    });
    const document = { title, content, description: String(record.description ?? "").slice(0,500), category: String(record.category ?? "").slice(0,80), model: String(record.model ?? "").slice(0,80), images, createdAt: record.createdAt ?? Date.now(), updatedAt: record.updatedAt ?? Date.now() };
    if (images.length > 8 || JSON.stringify(document).length > 850000) return reply({ error: "O prompt ultrapassa o limite de imagens." }, 400);
    // Optimistic precondition catches concurrent edits before publishing.
    const flagged = await setFlag(true);
    const { error } = await admin.from("mind_directory_prompts").upsert({ creator_id: uid, prompt_id: promptId, workspace_id: workspaceId, document });
    if (error) {
      // Restore the original flag only if no subsequent edit has occurred.
      await setFlag(record.isPublished === true, `${path}?updateMask.fieldPaths=isPublished&currentDocument.updateTime=${encodeURIComponent(flagged.updateTime)}`).catch(() => {});
      throw error;
    }
    return reply({ published: true });
  } catch (error) {
    return reply({ error: error instanceof PublicationError ? error.message : "Não foi possível alterar a publicação. Tente novamente." }, error instanceof PublicationError ? error.status : 500);
  }
});
