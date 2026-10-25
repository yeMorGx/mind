import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.3";

const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const allowedOrigins = new Set(["https://mind-lemon.vercel.app", "https://mindapp.icu", "https://www.mindapp.icu", "http://localhost:3000"]);
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
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
  } catch { return reply({ error: "Entre novamente na conta para continuar." }, 401); }
  try {
    const raw=await request.text();
    if(raw.length>5000)return reply({error:"Solicitação inválida."},400);
    const body=JSON.parse(raw);
    if(["comment","delete_comment"].includes(body.kind)){
      if(typeof body.targetId!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(body.targetId)||typeof body.promptId!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(body.promptId)||typeof body.id!=="string"||!/^[0-9a-f-]{36}$/.test(body.id)||typeof body.body!=="string"||body.body.length>1500)return reply({error:"Comentário inválido."},400);
      const {error}=await admin.rpc("mind_write_legacy_comment",{actor_value:uid,target_value:body.targetId,prompt_value:body.promptId,id_value:body.id,body_value:body.body,delete_value:body.kind==="delete_comment"});
      if(error)return reply({error:"Não foi possível salvar o comentário. Confira sua conta e tente novamente."},400);
      return reply({saved:true});
    }
    if(!["follow","like"].includes(body.kind)||typeof body.active!=="boolean"||typeof body.targetId!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(body.targetId)||(body.kind==="like"&&(typeof body.promptId!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(body.promptId))))return reply({error:"Solicitação inválida."},400);
    const {error}=await admin.rpc("mind_set_legacy_social",{actor_value:uid,kind_value:body.kind,target_value:body.targetId,prompt_value:body.kind==="like"?body.promptId:null,active_value:body.active});
    if(error){const known=["Sua conta já foi migrada","Escolha seu @","Perfil não encontrado","Este prompt não está público","Você não pode seguir"].some(prefix=>error.message.startsWith(prefix));return reply({error:known?error.message:"Não foi possível salvar. Tente novamente."},400);}
    return reply({saved:true});
  }catch{return reply({error:"Não foi possível salvar. Tente novamente."},500);}
});
