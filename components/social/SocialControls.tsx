"use client";
import { useState } from "react";
import { Heart,Check,Plus } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { useSocial } from "./SocialProvider";
function socialMessage(error:unknown){const text=error instanceof Error?error.message:"";return ["Escolha seu @","Sua conta já foi migrada","Este prompt não está público","Entre novamente"].some(prefix=>text.startsWith(prefix))?text:"Não foi possível salvar. Tente novamente.";}
export function LikeButton({creatorId,promptId}:{creatorId:string;promptId:string}){
  const target={creatorId,promptId};const {state,failed,change,retry}=useSocial(target);const {user}=useOnboarding();const {requestLogin}=useSiteLayout();
  const [pending,setPending]=useState(false),[error,setError]=useState("");
  async function click(){if(!user){requestLogin();return;}if(!state){retry();return;}setPending(true);setError("");try{await change(target,"like",!state.is_liked);}catch(error){setError(socialMessage(error));}finally{setPending(false);}}
  return <span className="social-like"><button type="button" aria-label={state?.is_liked?"Descurtir prompt":"Curtir prompt"} aria-pressed={state?.is_liked||false} disabled={pending||!state&&!failed} onClick={()=>void click()} className={state?.is_liked?"is-liked":""}><Heart size={18} fill={state?.is_liked?"currentColor":"none"}/><span>{state?state.likes:failed?"!":"…"}</span></button>{error&&<span role="alert" className="social-error">{error}</span>}{failed&&!state&&<button type="button" onClick={retry} className="social-retry">Tentar novamente</button>}</span>;
}
export function FollowControls({creatorId}:{creatorId:string}){
  const target={creatorId};const {state,failed,change,retry}=useSocial(target);const {user}=useOnboarding();const {requestLogin}=useSiteLayout();const owner=user?.uid===creatorId;
  const [pending,setPending]=useState(false),[error,setError]=useState("");
  async function click(){if(!user){requestLogin();return;}if(!state){retry();return;}setPending(true);setError("");try{await change(target,"follow",!state.is_following);}catch(error){setError(socialMessage(error));}finally{setPending(false);}}
  return <div className="social-follow"><div className="social-follow-row">{!owner&&<button type="button" onClick={()=>void click()} disabled={pending||!state&&!failed} aria-pressed={state?.is_following||false} className={`social-follow-button ${state?.is_following?"is-following":""}`}>{state?.is_following?<Check size={16}/>:<Plus size={16}/>} {pending?"Salvando…":state?.is_following?"Seguindo":"Seguir"}</button>}{state&&<span className="social-counts"><span><strong>{state.followers}</strong> {state.followers===1?"seguidor":"seguidores"}</span><span><strong>{state.following}</strong> seguindo</span></span>}</div>{!state&&!failed&&<span role="status" className="text-xs text-muted">Carregando seguidores…</span>}{failed&&!state&&<button type="button" onClick={retry} className="social-retry">Carregar seguidores</button>}{error&&<p role="alert" className="social-error">{error}</p>}</div>;
}
