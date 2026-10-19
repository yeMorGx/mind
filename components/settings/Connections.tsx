"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import{useEffect,useState}from"react";
import{Check,ExternalLink}from"lucide-react";
import{FaDiscord,FaGithub}from"react-icons/fa";
import{FcGoogle}from"react-icons/fc";
import{getIdentityProviders}from"@/lib/supabase/identity-providers";
import{requireSupabaseClient}from"@/lib/supabase/client";
type Connection={id:string;provider:string};
const providers=[{id:"google",name:"Google",description:"Sua conta Google para entrar no Mind.",Icon:FcGoogle},{id:"github",name:"GitHub",description:"Entre com sua conta do GitHub.",Icon:FaGithub},{id:"discord",name:"Discord",description:"Entre com sua conta do Discord.",Icon:FaDiscord}] as const;
export default function Connections(){
 const { t } = useI18n();

 const[attempt,setAttempt]=useState(0);
 const[state,setState]=useState<{identities:Connection[];available:Record<string,boolean>}|null>(null),[error,setError]=useState(""),[pending,setPending]=useState("");
 useEffect(()=>{let alive=true;const client=requireSupabaseClient();void Promise.all([client.auth.getUser(),getIdentityProviders()]).then(([user,settings])=>{if(user.error)throw user.error;if(alive)setState({identities:(user.data.user?.identities??[]).map(identity=>({id:identity.identity_id,provider:identity.provider})),available:settings});}).catch(()=>{if(alive)setError("Não foi possível consultar suas conexões. Recarregue a página para tentar novamente.");});return()=>{alive=false;};},[attempt]);
 async function link(provider:"google"|"github"|"discord"){
  setPending(provider);setError("");try{sessionStorage.setItem("mind-auth-return-to","/home/settings/connections");const {error}=await requireSupabaseClient().auth.linkIdentity({provider,options:{redirectTo:`${window.location.origin}/auth/callback`}});if(error)throw error;}catch{sessionStorage.removeItem("mind-auth-return-to");setError(t("Não foi possível conectar esta conta. Tente novamente mais tarde."));setPending("");}
 }
 return <div className="connection-list">{providers.map(({id,name,description,Icon})=>{const connected=state?.identities.some(identity=>identity.provider===id);return <div key={id} className="connection-row"><span className="settings-provider-icon"><Icon size={25}/></span><div className="connection-info"><h3>{name}</h3><p>{t(description)}</p></div>{connected?<span className="connection-status connected"><Check size={14}/>{t("Conectado")}</span>:<button type="button" className="workflow-button secondary" disabled={!state?.available[id]||Boolean(pending)} onClick={()=>void link(id)}>{pending===id?t("Conectando…"):!state?(error?t("Indisponível"):t("Consultando…")):state.available[id]?<>{t("Conectar")}{" "}<ExternalLink size={14}/></>:t("Em breve")}</button>}</div>})}{error&&<><p role="alert" className="settings-error">{t(error)}</p>{!state&&<button type="button" className="workflow-button secondary mt-4" onClick={()=>{setError("");setAttempt(value=>value+1);}}>{t("Tentar novamente")}</button>}</>}<p className="settings-section-note">{t("As conexões são usadas para login. Nenhum acesso a servidores do Discord ou repositórios será solicitado.")}</p></div>;
}
