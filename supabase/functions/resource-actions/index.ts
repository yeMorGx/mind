import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.3";
const keys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);
const origins = new Set([
  "https://mind-lemon.vercel.app",
  "https://mindapp.icu",
  "https://www.mindapp.icu",
  "http://localhost:3000",
]);
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin":
      origin && origins.has(origin) ? origin : "https://mind-lemon.vercel.app",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const reply = (value: unknown, status = 200) =>
    new Response(JSON.stringify(value), { status, headers });
  if (origin && !origins.has(origin))
    return reply({ error: "Origem não permitida." }, 403);
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return reply({ error: "Método não permitido." }, 405);
  // This bridge only accepts verified Firebase JWTs. Native accounts use RLS directly.
  let uid: string;
  try {
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new Error();
    const { payload } = await jwtVerify(token, keys, {
      algorithms: ["RS256"],
      issuer: "https://securetoken.google.com/mind-a9499",
      audience: "mind-a9499",
      requiredClaims: ["exp", "iat", "sub"],
      clockTolerance: 5,
    });
    if (!payload.sub || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub))
      throw new Error();
    uid = payload.sub;
  } catch {
    return reply({ error: "Entre novamente na sua conta." }, 401);
  }
  try {
    const account = await admin
      .from("mind_accounts")
      .select("public_id")
      .eq("public_id", uid)
      .maybeSingle();
    if (account.error) throw account.error;
    if (account.data)
      return reply(
        {
          error:
            "Sua conta já usa o login Google do Supabase. Entre novamente para renovar a sessão.",
        },
        409,
      );
    const username = await admin
      .from("mind_usernames")
      .select("username")
      .eq("public_id", uid)
      .maybeSingle();
    if (username.error) throw username.error;
    if (!username.data)
      return reply({ error: "Escolha seu @ antes de continuar." }, 403);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 300000)
      return reply({ error: "O conteúdo ultrapassa o limite permitido." }, 413);
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (body.action === "list") {
      const result = await admin
        .from("mind_resources")
        .select("*")
        .eq("creator_id", uid)
        .order("updated_at", { ascending: false });
      if (result.error) throw result.error;
      return reply({ resources: result.data });
    }
    if (body.action === "favorites") {
      const result = await admin
        .from("mind_resource_favorites")
        .select("resource_id")
        .eq("actor_id", uid);
      if (result.error) throw result.error;
      return reply({ ids: result.data.map((row) => row.resource_id) });
    }
    if (body.action === "save") {
      const resource = body.resource;
      if (
        !resource ||
        !uuid.test(resource.id) ||
        !["markdown", "mcp"].includes(resource.kind) ||
        !["draft", "published"].includes(resource.status)
      )
        return reply({ error: "Publicação inválida." }, 400);
      const existing = await admin
        .from("mind_resources")
        .select("id,creator_id,kind,updated_at")
        .eq("id", resource.id)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (
        existing.data &&
        (existing.data.creator_id !== uid ||
          existing.data.kind !== resource.kind)
      )
        return reply({ error: "Publicação não encontrada na sua conta." }, 403);
      if (
        existing.data &&
        (!body.expectedUpdatedAt ||
          new Date(body.expectedUpdatedAt).getTime() !==
            new Date(existing.data.updated_at).getTime())
      )
        return reply(
          {
            error:
              "Esta publicação foi alterada em outra aba. Reabra a edição.",
          },
          409,
        );
      // CHECK constraint validates all fields for both this bridge and native RLS writes.
      const query = existing.data
        ? admin
            .from("mind_resources")
            .update({ document: resource.document, status: resource.status })
            .eq("id", resource.id)
            .eq("creator_id", uid)
            .eq("updated_at", existing.data.updated_at)
        : admin
            .from("mind_resources")
            .insert({
              id: resource.id,
              creator_id: uid,
              kind: resource.kind,
              status: resource.status,
              document: resource.document,
            });
      const result = await query.select().maybeSingle();
      if (result.error) throw result.error;
      if (!result.data)
        return reply(
          { error: "Esta publicação mudou. Reabra a edição antes de salvar." },
          409,
        );
      return reply({ resource: result.data });
    }
    if (!uuid.test(body.id)) return reply({ error: "Recurso inválido." }, 400);
    if (body.action === "delete") {
      const result = await admin
        .from("mind_resources")
        .delete()
        .eq("id", body.id)
        .eq("creator_id", uid);
      if (result.error) throw result.error;
      return reply({ saved: true });
    }
    if (body.action === "favorite" && typeof body.active === "boolean") {
      if (body.active) {
        const resource = await admin
          .from("mind_resources")
          .select("id")
          .eq("id", body.id)
          .eq("status", "published")
          .maybeSingle();
        if (resource.error) throw resource.error;
        if (!resource.data)
          return reply({ error: "Este recurso não está público." }, 404);
      }
      const result = body.active
        ? await admin
            .from("mind_resource_favorites")
            .upsert(
              { actor_id: uid, resource_id: body.id },
              { onConflict: "actor_id,resource_id", ignoreDuplicates: true },
            )
        : await admin
            .from("mind_resource_favorites")
            .delete()
            .eq("actor_id", uid)
            .eq("resource_id", body.id);
      if (result.error) throw result.error;
      return reply({ saved: true });
    }
    return reply({ error: "Solicitação inválida." }, 400);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "23514")
      return reply(
        {
          error:
            "Confira os campos obrigatórios, os links HTTPS e os limites dos arquivos antes de salvar.",
        },
        400,
      );
    if (["42P01", "PGRST205"].includes(code))
      return reply(
        {
          error:
            "Esta área ainda está sendo ativada. Tente novamente em breve.",
        },
        503,
      );
    return reply({ error: "Não foi possível salvar. Tente novamente." }, 500);
  }
});
