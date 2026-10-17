"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowRight,Check} from "lucide-react";
import Link from "next/link";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import {useOnboarding} from "@/app/context/OnboardingContext";
import {useOnboardingGuard} from "@/lib/use-onboarding-guard";
import {getUsername} from "@/lib/supabase/creators";
export default function FinishPage(){
 const router=useRouter();const {data}=useOnboarding();const {user,ready}=useOnboardingGuard();const [identity,setIdentity]=useState<{uid:string;username:string}|null>(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);const uid=user?.uid;
 useEffect(()=>{if(!ready||!uid)return;if(!data.onboardingComplete){router.replace("/register/step-4");return;}let alive=true;void getUsername(uid).then(username=>{if(!alive)return;if(!username){router.replace("/register/step-2");return;}setIdentity({uid,username});setError(false);}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;};},[ready,uid,data.onboardingComplete,router,attempt]);
 return <OnboardingLayout step={4}>{ready&&user&&data.onboardingComplete&&identity&&identity.uid===uid?<><div className="onboarding-success-icon"><Check size={25}/></div><h1>Seu próximo prompt<br/>começa aqui.</h1><p className="onboarding-description">Sua conta está pronta. Salve suas ideias e publique os prompts que quiser compartilhar.</p><dl className="onboarding-summary"><div><dt>Perfil público</dt><dd>@{identity.username}</dd></div><div><dt>Biblioteca</dt><dd>{data.workspaceName}</dd></div><div><dt>Uso</dt><dd>{data.usageType==="team"?"Equipe":"Individual"}</dd></div></dl><Link href="/home" className="onboarding-submit">Abrir minha biblioteca <ArrowRight size={17}/></Link><Link href={`/u/@${identity.username}`} className="onboarding-back mt-3">Ver meu perfil público</Link></>:<><h1>Quase pronto.</h1>{error?<div className="onboarding-status"><p role="alert">Não foi possível confirmar seu perfil.</p><button className="onboarding-back" onClick={()=>{setError(false);setAttempt(value=>value+1);}}>Tentar novamente</button></div>:<p role="status" className="onboarding-status">Carregando seu perfil…</p>}</>}</OnboardingLayout>;
}
