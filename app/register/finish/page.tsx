"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowRight,Check} from "lucide-react";
import Link from "next/link";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import {useOnboarding} from "@/app/context/OnboardingContext";
import {useOnboardingGuard} from "@/lib/use-onboarding-guard";
import {getUsername} from "@/lib/supabase/creators";
export default function FinishPage(){
 const { t } = useI18n();

 const router=useRouter();const {data}=useOnboarding();const {user,ready}=useOnboardingGuard();const [identity,setIdentity]=useState<{uid:string;username:string}|null>(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);const uid=user?.uid;
 useEffect(()=>{if(!ready||!uid)return;if(!data.onboardingComplete){router.replace("/register/step-4");return;}let alive=true;void getUsername(uid).then(username=>{if(!alive)return;if(!username){router.replace("/register/step-2");return;}setIdentity({uid,username});setError(false);}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;};},[ready,uid,data.onboardingComplete,router,attempt]);
 return <OnboardingLayout step={4}>{ready&&user&&data.onboardingComplete&&identity&&identity.uid===uid?<><div className="onboarding-success-icon"><Check size={25}/></div><h1>{t("Seu próximo prompt")}<br/>{t("começa aqui.")}</h1><p className="onboarding-description">{t("Sua conta está pronta. Salve suas ideias e publique os prompts que quiser compartilhar.")}</p><dl className="onboarding-summary"><div><dt>{t("Perfil público")}</dt><dd>@{identity.username}</dd></div><div><dt>{t("Biblioteca")}</dt><dd>{data.workspaceName}</dd></div><div><dt>{t("Uso")}</dt><dd>{data.usageType==="team"?t("Equipe"):t("Individual")}</dd></div></dl><Link href="/home" className="onboarding-submit">{t("Abrir minha biblioteca")}{" "}<ArrowRight size={17}/></Link><Link href={`/u/@${identity.username}`} className="onboarding-back mt-3">{t("Ver meu perfil público")}</Link></>:<><h1>{t("Quase pronto.")}</h1>{error?<div className="onboarding-status"><p role="alert">{t("Não foi possível confirmar seu perfil.")}</p><button className="onboarding-back" onClick={()=>{setError(false);setAttempt(value=>value+1);}}>{t("Tentar novamente")}</button></div>:<p role="status" className="onboarding-status">{t("Carregando seu perfil…")}</p>}</>}</OnboardingLayout>;
}
