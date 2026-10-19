"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import PromptVideo from "@/components/prompts/PromptVideo";
import PromptComments from "@/components/prompts/PromptComments";
import PromptContent from "@/components/billing/PromptContent";
import PromptAccessSettings from "@/components/billing/PromptAccessSettings";
import PromptReferences from "@/components/prompts/PromptReferences";
import AIModelLogo from "@/components/models/AIModelLogo";
import {useMemo,useState,type ReactNode} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Share2} from "lucide-react";
import {ImageCompare} from "@/components/ui/ImageCompare";
import PromptCard from "./PromptCard";
import ResultsMarquee from "./ResultsMarquee";
import CreatorLanyard from "./CreatorLanyard";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import {LikeButton} from "@/components/social/SocialControls";
import type {Prompt} from "@/lib/supabase/types";
import type {CreatorProfile} from "@/lib/firebase/publication";
import "./scroll-shadow.css";
/* eslint-disable @next/next/no-img-element -- Published uploads include optimized data URLs. */
export default function PublicPromptPage({prompt,creatorPrompts=[],relatedPrompts=[],visibility="public",actions,creatorHref,creatorProfile}:{prompt:Prompt;creatorPrompts?:Prompt[];relatedPrompts?:Prompt[];visibility?:"public"|"private";actions?:ReactNode;creatorHref?:string;creatorProfile?:CreatorProfile}){
 const { t, intlLocale } = useI18n();

 const isPrivate=visibility==="private";
 const [message,setMessage]=useState("");
 const displayedImages=useMemo(()=>prompt.images.filter(image=>image.role==="gallery"||image.role==="after"),[prompt.images]);
 const before=prompt.images.find(image=>image.role==="before"),after=prompt.images.find(image=>image.role==="after");
 const references=prompt.images.filter(image=>image.role==="reference");
 const creatorName=creatorProfile?.name||prompt.creatorName||"Criador Mind";
 const profileHref=creatorHref||`/u/${encodeURIComponent(prompt.creatorId)}`;
 const formatDate=(timestamp:number)=>Number.isFinite(timestamp)?new Intl.DateTimeFormat(intlLocale,{day:"numeric",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"}).format(timestamp):"Não informada";
 async function sharePage(){try{const url=window.location.href;if(navigator.share){await navigator.share({title:prompt.title,url});setMessage(t("Página compartilhada."));}else{await navigator.clipboard.writeText(url);setMessage(t("Link copiado para compartilhar."));}}catch(error){if(error instanceof Error&&error.name==="AbortError")return;setMessage(t("Não foi possível compartilhar o link. Tente novamente."));}}
 const moreByCreator=creatorPrompts.map(item=>({...item,creatorAvatarUrl:creatorProfile?.avatarUrl||item.creatorAvatarUrl,creatorBadges:creatorProfile?.badges??item.creatorBadges,creatorSlug:creatorProfile?.username||item.creatorSlug}));
 return <main className="prompt-detail-page">
  <div className="prompt-detail-inner">
   <Link href={isPrivate?"/home":"/explore"} className="prompt-detail-back"><ArrowLeft size={16}/>{isPrivate?t("Voltar à biblioteca"):t("Explorar prompts")}</Link>
   <article>
    <header className="prompt-detail-heading">
     <div className="prompt-detail-title-row"><h1>{prompt.title}</h1><div className="prompt-detail-tags">{prompt.model&&<span className="ai-model-name-tag"><AIModelLogo value={prompt.model}/>{prompt.model}</span>}{prompt.category&&<span>{prompt.category}</span>}</div></div>
     <div className="prompt-detail-byline"><CreatorIdentity name={creatorName} avatarUrl={creatorProfile?.avatarUrl||prompt.creatorAvatarUrl} badges={creatorProfile?.badges??prompt.creatorBadges} username={creatorProfile?.username||prompt.creatorSlug} href={profileHref}/><div className="prompt-detail-controls">{!isPrivate&&<><LikeButton creatorId={prompt.creatorId} promptId={prompt.id}/><button type="button" onClick={()=>void sharePage()} className="prompt-detail-share"><Share2 size={16}/><span>{t("Compartilhar")}</span></button></>}</div></div>
     {actions&&<div className="prompt-detail-owner-actions">{actions}</div>}
    </header>
    {message&&<p className="prompt-detail-status" role="status">{t(message)}</p>}
    <div className="prompt-detail-main">
     <div className="prompt-detail-results">{prompt.kind==="video"&&(prompt.videoPath||prompt.videoUrl)?<section><h2 className="mb-4 text-lg font-semibold">{t("Resultado do prompt")}</h2><PromptVideo path={prompt.videoPath} url={prompt.videoUrl} poster={displayedImages[0]?.url}/></section>:displayedImages.length?<ResultsMarquee images={displayedImages}/>:<div className="prompt-detail-no-images"><h2>{t("Um prompt para experimentar")}</h2><p>{t("O criador ainda não adicionou imagens de resultado.")}</p></div>}</div>
     <section id="prompt-text" className="prompt-detail-copy" aria-labelledby="prompt-text-heading">{prompt.description&&<p className="prompt-detail-description">{prompt.description}</p>}{prompt.kind==="website"&&prompt.siteUrl&&<a href={prompt.siteUrl} target="_blank" rel="noopener noreferrer" className="workflow-button secondary mt-4">{t("Visitar site gerado")}{" "}<ArrowRight size={16}/></a>}<PromptContent content={prompt.content} creatorId={prompt.creatorId} promptId={prompt.id} locked={!isPrivate&&prompt.requiresUnlock===true} hasImages={prompt.images.length>0} isPrivate={isPrivate}/></section>
     {(before||references.length>0)&&<div className="prompt-detail-media-notes">
      {before&&<section className="prompt-comparison" aria-labelledby="comparison-heading"><h2 id="comparison-heading">{after?t("Antes e depois"):t("Imagem original")}</h2>{after?<><p>{t("Arraste a divisória para comparar o resultado.")}</p><ImageCompare beforeSrc={before.url} afterSrc={after.url} beforeAlt={before.label||"Antes"} afterAlt={after.label||"Depois"}/></>:<img src={before.url} alt={before.label||t("Imagem original")} loading="lazy" className="prompt-original-image"/>}</section>}
      {references.length>0&&<PromptReferences images={references}/>}
     </div>}
    </div>
    <div className="prompt-detail-support">
     <section id="creator" className="prompt-detail-creator" aria-labelledby="creator-heading"><h2 id="creator-heading">{t("Conheça o criador")}</h2>{creatorProfile?<CreatorLanyard profile={creatorProfile} href={profileHref}/>:<div className="py-8"><CreatorIdentity name={creatorName} avatarUrl={prompt.creatorAvatarUrl} badges={prompt.creatorBadges} href={profileHref}/></div>}{moreByCreator.length>0&&<a href="#creator-prompts" className="prompt-detail-more-creator">{t("Mais prompts deste criador")}{" "}<ArrowRight size={16}/></a>}</section>
     <section className="prompt-detail-how" aria-labelledby="how-to-heading"><h2 id="how-to-heading">{t("Como usar")}</h2><ol><li><span>1</span><div><h3>{t("Copie o prompt")}</h3><p>{t("Use o botão acima para copiar o texto completo.")}</p></div></li><li><span>2</span><div><h3>{t("Abra")}{" "}{prompt.model||t("sua ferramenta de IA")}</h3><p>{t("Cole o texto.")}{references.length?t(" Baixe as referências acima e anexe na ordem indicada pelo criador."):before?t(" Adicione a imagem original se a ferramenta permitir."):""}</p></div></li><li><span>3</span><div><h3>{t("Faça do seu jeito")}</h3><p>{t("Adapte os detalhes ao seu objetivo e gere o resultado.")}</p></div></li></ol><p className="prompt-detail-disclaimer">{t("Os resultados podem variar conforme o modelo, a versão e as configurações.")}</p></section>
     <section className="prompt-detail-about" aria-labelledby="about-heading"><h2 id="about-heading">{t("Sobre este prompt")}</h2><dl>{[["Ferramenta",prompt.model||"Não informada"],["Categoria",prompt.category||"Não informada"],["Acesso",isPrivate?"Sua biblioteca":prompt.requiresUnlock?"Disponível por desbloqueio":"Livre para todos"],["Criado em",formatDate(prompt.createdAt)],...(prompt.updatedAt>prompt.createdAt?[["Atualizado em",formatDate(prompt.updatedAt)]]:[])].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
     {prompt.status==="published"&&<PromptAccessSettings creatorId={prompt.creatorId} promptId={prompt.id}/>}
    </div>
   </article>
   {(!isPrivate||prompt.status==="published")&&<PromptComments key={`${prompt.creatorId}:${prompt.id}`} creatorId={prompt.creatorId} promptId={prompt.id}/>}
   {(moreByCreator.length>0||relatedPrompts.length>0)&&<section className="prompt-detail-explore" aria-labelledby="continue-heading"><div className="prompt-detail-explore-heading"><h2 id="continue-heading">{t("Continue explorando")}</h2><Link href="/explore">{t("Ver todos")}{" "}<ArrowRight size={16}/></Link></div>{moreByCreator.length>0&&<section id="creator-prompts"><h3 className="prompt-detail-recommendation-label">{t("Mais de")}{" "}{creatorName}</h3><div className="prompt-detail-recommendations">{moreByCreator.map(item=><PromptCard key={`${item.creatorId}:${item.id}`} prompt={item}/>)}</div></section>}{relatedPrompts.length>0&&<section><h3 className="prompt-detail-recommendation-label">{prompt.category?t("Outros prompts de {v0}", {v0: (prompt.category)}):t("Outros prompts para descobrir")}</h3><div className="prompt-detail-recommendations">{relatedPrompts.map(item=><PromptCard key={`${item.creatorId}:${item.id}`} prompt={item}/>)}</div></section>}</section>}
  </div>
 </main>;
}
