"use client";
import AIModelLogo from "@/components/models/AIModelLogo";
import {useState} from "react";
import Link from "next/link";
import {ArrowUpRight,ImageIcon} from "lucide-react";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import {creatorProfileHref} from "@/lib/usernames";
import type {Prompt} from "@/lib/supabase/types";
export default function PromptCard({prompt}:{prompt:Prompt}){
 const cover=prompt.images.find(image=>image.role==="gallery"||image.role==="after")??prompt.images[0];
 const [failed,setFailed]=useState<string|null>(null);
 return <article className="recommendation-card">
  <Link href={`/p/${prompt.slug}`} className="recommendation-cover" aria-label={`Abrir ${prompt.title}`}>
   {/* eslint-disable-next-line @next/next/no-img-element -- Public prompt image URLs. */}
   {cover&&failed!==cover.url?<img src={cover.url} alt={cover.label||prompt.title} loading="lazy" onError={()=>setFailed(cover.url)}/>:<span><ImageIcon size={24}/>{prompt.description||"Conheça este prompt"}</span>}
   <span className="recommendation-open" aria-hidden="true"><ArrowUpRight size={18}/></span>
  </Link>
  <div className="recommendation-info"><Link href={`/p/${prompt.slug}`}><h3>{prompt.title}</h3></Link>{prompt.model&&<AIModelLogo value={prompt.model}/>}</div>
  <CreatorIdentity name={prompt.creatorName||"Criador Mind"} avatarUrl={prompt.creatorAvatarUrl} badges={prompt.creatorBadges} href={creatorProfileHref(prompt.creatorId,prompt.creatorSlug)} by/>
 </article>;
}
