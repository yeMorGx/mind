"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import CreatorPreview from "@/components/profile/CreatorPreview";
import {useCallback,useState,type CSSProperties} from "react";
import PromptCover from "@/components/prompts/PromptCover";
import AIModelLogo from "@/components/models/AIModelLogo";
import Link from "next/link";
import { LikeButton } from "@/components/social/SocialControls";
import type { Prompt } from "@/lib/supabase/types";
export default function PublicPromptCard({prompt}:{prompt:Prompt}){
 const { t } = useI18n();

  const [aspect,setAspect]=useState(4/3);
  const [measured,setMeasured]=useState(false);
  const imageSize=useCallback((width:number,height:number)=>{if(width&&height&&!measured){setAspect(Math.min(1.85,Math.max(0.8,width/height)));setMeasured(true);}},[measured]);
  return <article className="catalog-public-card wireframe-prompt-card" style={{"--prompt-cover-ratio":aspect} as CSSProperties}>
    <Link href={`/p/${prompt.slug}`} aria-label={t("Abrir {v0}", {v0: (prompt.title)})} className="catalog-card-cover">
      <PromptCover prompt={prompt} pixelTransition onImageSize={imageSize}/>
      {prompt.model&&<span className="explore-model-logo"><AIModelLogo value={prompt.model}/></span>}
    </Link>
    <div className="prompt-card-details">
      <div className="prompt-card-creator-row"><CreatorPreview prompt={prompt}/><LikeButton creatorId={prompt.creatorId} promptId={prompt.id}/></div>
      <Link href={`/p/${prompt.slug}`} className="mt-2 block"><h2 className="line-clamp-2 break-words text-base font-semibold leading-6">{prompt.title}</h2></Link>
{(prompt.summary||prompt.description)&&<p className="prompt-card-summary">{prompt.summary||prompt.description}</p>}
    </div>
  </article>;
}
