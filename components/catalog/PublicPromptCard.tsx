"use client";
import AIModelLogo from "@/components/models/AIModelLogo";
import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { creatorProfileHref } from "@/lib/usernames";
import { LikeButton } from "@/components/social/SocialControls";
import type { Prompt } from "@/lib/supabase/types";
export default function PublicPromptCard({prompt}:{prompt:Prompt}){
  const [failedCover,setFailedCover]=useState<string|null>(null),[failedAvatar,setFailedAvatar]=useState<string|null>(null);
  const name=prompt.creatorName||"Criador Mind";
  const cover=prompt.images.find(image=>image.role==="gallery"||image.role==="after")??prompt.images[0];
  return <article className="catalog-public-card wireframe-prompt-card">
    <Link href={`/p/${prompt.slug}`} aria-label={`Abrir ${prompt.title}`} className="catalog-card-cover">
      {/* eslint-disable-next-line @next/next/no-img-element -- Published results include optimized data URLs. */}
      {cover&&failedCover!==cover.url?<img src={cover.url} alt={cover.label||prompt.title} loading="lazy" draggable={false} onError={()=>setFailedCover(cover.url)}/>:<div className="catalog-text-preview"><Sparkles size={24}/><p>{prompt.description||"Ver o prompt completo e seus resultados."}</p></div>}
    </Link>
    <div className="prompt-card-details">
      <div className="prompt-card-creator-row"><Link href={creatorProfileHref(prompt.creatorId,prompt.creatorSlug)} title={prompt.creatorSlug?`${name} · @${prompt.creatorSlug}`:name} className="prompt-card-creator">
        {/* eslint-disable-next-line @next/next/no-img-element -- Creator avatars include optimized data URLs. */}
        {prompt.creatorAvatarUrl&&failedAvatar!==prompt.creatorAvatarUrl?<img src={prompt.creatorAvatarUrl} alt="" loading="lazy" className="size-8 shrink-0 rounded-full object-cover" onError={()=>setFailedAvatar(prompt.creatorAvatarUrl||"")}/>:<span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-media text-xs font-medium">{Array.from(name.trim())[0]?.toUpperCase()||"M"}</span>}
        <span className="truncate text-sm font-medium">{name}</span>
      </Link><LikeButton creatorId={prompt.creatorId} promptId={prompt.id}/></div>
      <Link href={`/p/${prompt.slug}`} className="mt-2 block"><h2 className="line-clamp-2 break-words text-base font-semibold leading-6">{prompt.title}</h2></Link>
      {prompt.model&&<div className="mt-2"><AIModelLogo value={prompt.model}/></div>}
    </div>
  </article>;
}
