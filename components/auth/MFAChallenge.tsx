"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {useEffect,useState} from "react";
import CodeSlots from "@/components/ui/react-bits/CodeSlots";
import {ShieldCheck,LogOut} from "lucide-react";
import {requireSupabaseClient} from "@/lib/supabase/client";
export default function MFAChallenge({onVerified,onSignOut,externalError=""}:{onVerified:()=>void;onSignOut:()=>Promise<void>;externalError?:string}){
 const { t } = useI18n();

 const [factor,setFactor]=useState(""),[code,setCode]=useState(""),[pending,setPending]=useState(false),[error,setError]=useState("");
 useEffect(()=>{let active=true;void requireSupabaseClient().auth.mfa.listFactors().then(({data,error})=>{if(!active)return;if(error){setError("Não foi possível carregar o autenticador. Recarregue a página.");return;}setFactor(data.totp.find(item=>item.status==="verified")?.id||"");});return()=>{active=false;};},[]);
 return <main className="mfa-challenge"><form onSubmit={async event=>{event.preventDefault();if(pending||!factor)return;setPending(true);setError("");try{const {error}=await requireSupabaseClient().auth.mfa.challengeAndVerify({factorId:factor,code});if(error)throw error;onVerified();}catch{setError(t("Código inválido ou expirado. Confira o aplicativo e tente novamente."));}finally{setPending(false);}}}><span className="mfa-challenge-icon"><ShieldCheck size={28}/></span><h1>{t("Confirme que é você")}</h1><p>{t("Digite o código de seis dígitos do seu aplicativo autenticador para acessar sua conta.")}</p><div className="mfa-code-field"><label htmlFor="mfa-login-code">{t("Código do autenticador")}</label><CodeSlots ariaLabel={t("Código do autenticador")} id="mfa-login-code" autoFocus value={code} disabled={pending||!factor} status={error?"error":"idle"} onChange={value=>{setCode(value);if(value)setError("");}}/></div><button type="submit" className="workflow-button" disabled={pending||!factor||code.length!==6}>{pending?t("Verificando…"):t("Confirmar acesso")}</button><p role="alert" className="settings-error">{error||externalError}</p><button type="button" className="mfa-signout" disabled={pending} onClick={()=>void onSignOut()}><LogOut size={16}/>{t("Sair desta conta")}</button></form></main>;
}
