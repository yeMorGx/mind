"use client";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import PromptCover from "@/components/prompts/PromptCover";
import AIModelLogo from "@/components/models/AIModelLogo";
import Link from "next/link";
import { creatorProfileHref } from "@/lib/usernames";
import { LikeButton } from "@/components/social/SocialControls";
import type { Prompt } from "@/lib/supabase/types";
export default function PublicPromptCard({prompt}:{prompt:Prompt}){
  const name=prompt.creatorName||"Criador Mind";
  return <article className="catalog-public-card wireframe-prompt-card">
    <Link href={`/p/${prompt.slug}`} aria-label={`Abrir ${prompt.title}`} className="catalog-card-cover">
      <PromptCover prompt={prompt}/>
      {prompt.model&&<span className="explore-model-logo"><AIModelLogo value={prompt.model}/></span>}
    </Link>
    <div className="prompt-card-details">
      <div className="prompt-card-creator-row"><CreatorIdentity name={name} avatarUrl={prompt.creatorAvatarUrl} badges={prompt.creatorBadges} href={creatorProfileHref(prompt.creatorId,prompt.creatorSlug)}/><LikeButton creatorId={prompt.creatorId} promptId={prompt.id}/></div>
      <Link href={`/p/${prompt.slug}`} className="mt-2 block"><h2 className="line-clamp-2 break-words text-base font-semibold leading-6">{prompt.title}</h2></Link>
{(prompt.summary||prompt.description)&&<p className="prompt-card-summary">{prompt.summary||prompt.description}</p>}
    </div>
  </article>;
}
