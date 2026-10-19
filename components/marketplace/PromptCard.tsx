"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import PromptCover from "@/components/prompts/PromptCover";
import AIModelLogo from "@/components/models/AIModelLogo";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import {creatorProfileHref} from "@/lib/usernames";
import type {Prompt} from "@/lib/supabase/types";
export default function PromptCard({prompt}:{prompt:Prompt}){
 const { t } = useI18n();

 return <article className="recommendation-card">
  <Link href={`/p/${prompt.slug}`} className="recommendation-cover" aria-label={t("Abrir {v0}", {v0: (prompt.title)})}>
   <PromptCover prompt={prompt}/>
   <span className="recommendation-open" aria-hidden="true"><ArrowUpRight size={18}/></span>
  </Link>
  <div className="recommendation-info"><Link href={`/p/${prompt.slug}`}><h3>{prompt.title}</h3></Link>{prompt.model&&<AIModelLogo value={prompt.model}/>}</div>
{(prompt.summary||prompt.description)&&<p className="prompt-card-summary">{prompt.summary||prompt.description}</p>}
  <CreatorIdentity name={prompt.creatorName||"Criador Mind"} avatarUrl={prompt.creatorAvatarUrl} badges={prompt.creatorBadges} href={creatorProfileHref(prompt.creatorId,prompt.creatorSlug)} by/>
 </article>;
}
