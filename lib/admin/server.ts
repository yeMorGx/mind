import "server-only";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import { adminClient, apiError, ServiceError } from "@/lib/billing/server";
export type AdminPermission = "overview"|"users"|"badges"|"campaigns"|"inbox"|"audit"|"analytics"|"sales";
const capabilities:Record<string,AdminPermission[]>={owner:["overview","users","badges","campaigns","inbox","audit","analytics","sales"],admin:["overview","users","badges","campaigns","inbox","audit","analytics","sales"],moderator:["overview","users"]};
export class AdminError extends ServiceError {constructor(message:string,status:number,public code:string){super(message,status);}}
const remoteKeys=new Map<string,ReturnType<typeof createRemoteJWKSet>>();
export async function requireAdmin(request:Request,permission:AdminPermission="overview") {
 const host=process.env.MIND_ADMIN_HOST || "admin.mindapp.icu";
 const accessMode=process.env.MIND_ADMIN_ACCESS_MODE || "cloudflare";
 const team=process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN, audience=process.env.CLOUDFLARE_ACCESS_AUD;
 // The deployment must explicitly select application-only access. A missing or
 // invalid Cloudflare configuration never silently bypasses that extra layer.
 if(process.env.MIND_ADMIN_ENABLED!=="true"||!["application","cloudflare"].includes(accessMode))throw new AdminError("A administração aguarda a configuração do acesso seguro.",503,"admin_setup_required");
 if(accessMode==="cloudflare"&&(!team||!audience||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(team)))throw new AdminError("A administração aguarda a configuração do acesso seguro.",503,"admin_setup_required");
 if(new URL(request.url).hostname!==host || new URL(request.url).protocol!=="https:")throw new AdminError("Use o endereço protegido da administração.",403,"admin_host_required");
 if(request.method!=="GET" && request.headers.get("origin")!==`https://${host}`)throw new AdminError("Origem não permitida.",403,"admin_origin_invalid");
 let accessEmail:string|undefined;
 if(accessMode==="cloudflare"){
  const accessToken=request.headers.get("cf-access-jwt-assertion");
  if(!accessToken)throw new AdminError("Confirme o acesso da equipe.",403,"admin_access_required");
  try {
   if(!remoteKeys.has(team!))remoteKeys.set(team!,createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`)));
   const {payload}=await jwtVerify(accessToken,remoteKeys.get(team!)!,{issuer:team,audience,algorithms:["RS256"],requiredClaims:["exp","iat","sub","email"]});
   accessEmail=String(payload.email).toLowerCase();
  }catch{throw new AdminError("Confirme o acesso da equipe.",403,"admin_access_required");}
 }
 if(request.headers.get("x-mind-backend")!=="supabase")throw new AdminError("Entre com sua conta Google atualizada.",401,"admin_login_required");
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token||token.length>16000)throw new AdminError("Entre na conta administradora.",401,"admin_login_required");
 const admin=adminClient();
 const verified=await admin.auth.getUser(token);
 if(verified.error||!verified.data.user?.email_confirmed_at)throw new AdminError("Entre na conta administradora.",401,"admin_login_required");
 if(accessEmail!==undefined&&verified.data.user.email?.toLowerCase()!==accessEmail)throw new AdminError("Use a mesma conta autorizada no acesso da equipe.",401,"admin_login_required");
 const account=await admin.from("mind_accounts").select("public_id").eq("id",verified.data.user.id).maybeSingle();
 if(account.error||!account.data)throw new AdminError("Acesso restrito à administração.",403,"admin_forbidden");
 const membership=await admin.from("mind_admin_memberships").select("role,active").eq("actor_id",account.data.public_id).maybeSingle();
 if(membership.error)throw new AdminError("Administração indisponível. Tente novamente.",503,"admin_unavailable");
 const member=membership.data;
 if(!member?.active||!capabilities[member.role]?.includes(permission))throw new AdminError("Acesso restrito à administração.",403,"admin_forbidden");
 // getUser above validates this exact JWT; only then inspect its signed assurance claims.
 const claims=decodeJwt(token);
 const now=Date.now()/1000;
 const factors=Array.isArray(claims.amr)?claims.amr as {method?:string;timestamp?:number}[]:[];
 const recent=factors.some(f=>typeof f.timestamp==="number" && /^(totp|mfa\/totp|mfa\/phone)$/.test(f.method||"") && f.timestamp>=now-900 && f.timestamp<=now+30);
 if(claims.aal!=="aal2"||!recent)throw new AdminError("Confirme o autenticador para acessar a administração.",403,"admin_mfa_required");
 if(typeof claims.session_id!=="string"||!/^[0-9a-f-]{36}$/i.test(claims.session_id))throw new AdminError("Entre novamente na conta administradora.",401,"admin_login_required");
 const session=await admin.rpc("mind_admin_session_active",{account:verified.data.user.id,session:claims.session_id});
 if(session.error||session.data!==true)throw new AdminError("Entre novamente na conta administradora.",401,"admin_login_required");
 const rate=await admin.rpc("mind_admin_rate",{actor:account.data.public_id});
 if(rate.error)throw new AdminError("Administração indisponível. Tente novamente.",503,"admin_unavailable");
 if(!rate.data)throw new AdminError("Muitas solicitações. Aguarde um minuto.",429,"admin_rate_limited");
 return {admin,actor:account.data.public_id,role:member.role as string,permissions:capabilities[member.role]};
}
export function adminApiError(error:unknown) {
 if(error instanceof AdminError)return Response.json({error:error.message,code:error.code},{status:error.status,headers:{"Cache-Control":"private, no-store"}});
 return apiError(error);
}
