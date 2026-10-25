import {createClient} from "npm:@supabase/supabase-js@2.117.3";
import {createRemoteJWKSet,jwtVerify} from "npm:jose@6.1.3";
const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const keys=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const origins=new Set(["https://mind-lemon.vercel.app","https://mindapp.icu","https://www.mindapp.icu","http://localhost:3000"]);
Deno.serve(async request=>{
 const origin=request.headers.get("origin");const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":origin&&origins.has(origin)?origin:"https://mind-lemon.vercel.app","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS",Vary:"Origin"};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:"Origem não permitida."},403);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});if(request.method!=="POST")return reply({error:"Método não permitido."},405);
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];if(!token)return reply({error:"Entre novamente."},401);
 let actor:string;
 try{
  const {data,error}=await admin.auth.getUser(token);
  if(!error&&data.user){
   // Bootstrap checks the real account mapping and AAL2 before any private access.
   const sessionClient=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
   const account=await sessionClient.rpc("mind_bootstrap_account");if(account.error||!account.data?.public_id)throw new Error();actor=account.data.public_id;
  }else{
   const {payload}=await jwtVerify(token,keys,{algorithms:["RS256"],issuer:"https://securetoken.google.com/mind-a9499",audience:"mind-a9499",requiredClaims:["exp","iat","sub"]});
   if(!payload.sub||!/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub))throw new Error();actor=payload.sub;
   const migrated=await admin.from("mind_accounts").select("public_id").eq("public_id",actor).maybeSingle();if(migrated.error||migrated.data)throw new Error();
  }
 }catch{return reply({error:"Confirme seu login para enviar vídeos."},401)}
 try{
  const raw=await request.text();if(raw.length>300)return reply({error:"Arquivo inválido."},400);const body=JSON.parse(raw);
  if(body.action==="read"){
    if(typeof body.path!=="string"||!body.path.startsWith(`${actor}/`)||!/^[A-Za-z0-9_-]{1,128}\/[0-9a-f-]{36}\.(mp4|webm)$/.test(body.path))return reply({error:"Vídeo não encontrado."},404);
    const signed=await admin.storage.from("mind-prompt-videos").createSignedUrl(body.path,300);if(signed.error)throw signed.error;return reply({url:signed.data.signedUrl});
  }
  if(!Number.isInteger(body.size)||body.size<=0||body.size>31457280||!["video/mp4","video/webm"].includes(body.type))return reply({error:"Use MP4 ou WebM de até 30 MB."},400);
  const existing=await admin.storage.from("mind-prompt-videos").list(actor,{limit:101});if(existing.error||existing.data.length>=100)return reply({error:"Limite de vídeos atingido. Contate o suporte."},400);
  const path=`${actor}/${crypto.randomUUID()}.${body.type==="video/mp4"?"mp4":"webm"}`;
  const result=await admin.storage.from("mind-prompt-videos").createSignedUploadUrl(path,{upsert:false});if(result.error)throw result.error;
  return reply({path,token:result.data.token});
 }catch{return reply({error:"Não foi possível preparar o vídeo."},500)}
});
