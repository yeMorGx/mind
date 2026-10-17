"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import LibrarySetupForm from "@/components/onboarding/LibrarySetupForm";
import {useOnboarding} from "@/app/context/OnboardingContext";
import {useOnboardingGuard} from "@/lib/use-onboarding-guard";
import {createWorkspaceForUser} from "@/lib/firebase/data";
import {getUsername} from "@/lib/supabase/creators";
export default function LibraryStep(){
 const router=useRouter();const {user,ready}=useOnboardingGuard();const {data,updateData}=useOnboarding();const [checked,setChecked]=useState(""),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);const uid=user?.uid;
 useEffect(()=>{if(!ready||!uid)return;let alive=true;if(data.onboardingComplete&&data.primaryWorkspaceId){router.replace("/register/finish");return;}void getUsername(uid).then(username=>{if(!alive)return;if(!username||!data.role){router.replace("/register/step-2");return;}setChecked(uid);setError(false);}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;};},[uid,ready,data.role,data.onboardingComplete,data.primaryWorkspaceId,router,attempt]);
 return <OnboardingLayout step={3}>{ready&&user&&checked===uid&&!data.onboardingComplete?<LibrarySetupForm key={user.uid} initial={data} back={values=>{updateData(values);router.push("/register/step-2");}} save={async values=>{const id=await createWorkspaceForUser(user,values);updateData({...values,primaryWorkspaceId:id,onboardingComplete:true});router.push("/register/finish");}}/>:<><h1>Sua biblioteca.</h1>{error?<div className="onboarding-status"><p role="alert">Não foi possível confirmar seu perfil. Tente novamente.</p><button className="onboarding-back" onClick={()=>{setError(false);setAttempt(value=>value+1);}}>Tentar novamente</button></div>:<p role="status" className="onboarding-status">Preparando a próxima etapa…</p>}</>}</OnboardingLayout>;
}
