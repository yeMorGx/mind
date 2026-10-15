"use client";
import AIModelLogo from "@/components/models/AIModelLogo";
import {useMemo,useState,type ReactNode} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Check,Copy,Share2} from "lucide-react";
import {ImageCompare} from "@/components/ui/ImageCompare";
import PromptCard from "./PromptCard";
import ResultsMarquee from "./ResultsMarquee";
import CreatorLanyard from "./CreatorLanyard";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import {LikeButton} from "@/components/social/SocialControls";
import type {Prompt} from "@/lib/supabase/types";
import type {CreatorProfile} from "@/lib/firebase/publication";
/* eslint-disable @next/next/no-img-element -- Published uploads include optimized data URLs. */
export default function PublicPromptPage({prompt,creatorPrompts=[],relatedPrompts=[],visibility="public",actions,creatorHref,creatorProfile}:{prompt:Prompt;creatorPrompts?:Prompt[];relatedPrompts?:Prompt[];visibility?:"public"|"private";actions?:ReactNode;creatorHref?:string;creatorProfile?:CreatorProfile}){
 const isPrivate=visibility==="private";
 const [copied,setCopied]=useState(false),[message,setMessage]=useState(""),[copyError,setCopyError]=useState("");
 const displayedImages=useMemo(()=>prompt.images.filter(image=>image.role==="gallery"||image.role==="after"),[prompt.images]);
 const before=prompt.images.find(image=>image.role==="before"),after=prompt.images.find(image=>image.role==="after");
 const references=prompt.images.filter(image=>image.role==="reference");
 const creatorName=creatorProfile?.name||prompt.creatorName||"Criador Mind";
 const profileHref=creatorHref||`/u/${encodeURIComponent(prompt.creatorId)}`;
 const formatDate=(timestamp:number)=>Number.isFinite(timestamp)?new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"}).format(timestamp):"Não informada";
 async function copyPrompt(){try{await navigator.clipboard.writeText(prompt.content);setCopied(true);setCopyError("");window.setTimeout(()=>setCopied(false),1800);}catch{setCopyError("Não foi possível copiar automaticamente. Selecione o texto do prompt para copiar.");}}
 async function sharePage(){try{const url=window.location.href;if(navigator.share){await navigator.share({title:prompt.title,url});setMessage("Página compartilhada.");}else{await navigator.clipboard.writeText(url);setMessage("Link copiado para compartilhar.");}}catch(error){if(error instanceof Error&&error.name==="AbortError")return;setMessage("Não foi possível compartilhar o link. Tente novamente.");}}
 const moreByCreator=creatorPrompts.map(item=>({...item,creatorAvatarUrl:creatorProfile?.avatarUrl||item.creatorAvatarUrl,creatorBadges:creatorProfile?.badges??item.creatorBadges,creatorSlug:creatorProfile?.username||item.creatorSlug}));
 return <main className="prompt-detail-page">
  <div className="prompt-detail-inner">
   <Link href={isPrivate?"/home":"/explore"} className="prompt-detail-back"><ArrowLeft size={16}/>{isPrivate?"Voltar à biblioteca":"Explorar prompts"}</Link>
   <article>
    <header className="prompt-detail-heading">
     <div className="prompt-detail-title-row"><h1>{prompt.title}</h1><div className="prompt-detail-tags">{prompt.model&&<span className="ai-model-name-tag"><AIModelLogo value={prompt.model}/>{prompt.model}</span>}{prompt.category&&<span>{prompt.category}</span>}</div></div>
     <div className="prompt-detail-byline"><CreatorIdentity name={creatorName} avatarUrl={creatorProfile?.avatarUrl||prompt.creatorAvatarUrl} badges={creatorProfile?.badges??prompt.creatorBadges} username={creatorProfile?.username||prompt.creatorSlug} href={profileHref}/><div className="prompt-detail-controls">{!isPrivate&&<><LikeButton creatorId={prompt.creatorId} promptId={prompt.id}/><button type="button" onClick={()=>void sharePage()} className="prompt-detail-share"><Share2 size={16}/><span>Compartilhar</span></button></>}<a href="#prompt-text" className="workflow-button">Usar prompt <ArrowRight size={16}/></a></div></div>
     {actions&&<div className="prompt-detail-owner-actions">{actions}</div>}
    </header>
    {message&&<p className="prompt-detail-status" role="status">{message}</p>}
    <div className="prompt-detail-main">
     <div className="prompt-detail-results">{displayedImages.length?<ResultsMarquee images={displayedImages}/>:<div className="prompt-detail-no-images"><h2>Um prompt para experimentar</h2><p>O criador ainda não adicionou imagens de resultado.</p></div>}</div>
     <section id="prompt-text" className="prompt-detail-copy" aria-labelledby="prompt-text-heading"><div className="prompt-detail-section-heading"><h2 id="prompt-text-heading">O prompt</h2><button type="button" className="workflow-button" onClick={()=>void copyPrompt()}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?"Copiado":"Copiar prompt"}</button></div>{prompt.description&&<p className="prompt-detail-description">{prompt.description}</p>}<pre tabIndex={0} aria-label="Texto completo do prompt">{prompt.content}</pre><p className="prompt-detail-copy-note">{isPrivate?"Seu prompt na biblioteca. Só você tem acesso a esta página.":"Grátis para visualizar, copiar e experimentar."}</p><p role="status" className="prompt-detail-status">{copyError}</p><span role="status" className="sr-only">{copied?"Prompt copiado para a área de transferência.":""}</span></section>
     {(before||references.length>0)&&<div className="prompt-detail-media-notes">
      {before&&<section className="prompt-comparison" aria-labelledby="comparison-heading"><h2 id="comparison-heading">{after?"Antes e depois":"Imagem original"}</h2>{after?<><p>Arraste a divisória para comparar o resultado.</p><ImageCompare beforeSrc={before.url} afterSrc={after.url} beforeAlt={before.label||"Antes"} afterAlt={after.label||"Depois"}/></>:<img src={before.url} alt={before.label||"Imagem original"} loading="lazy" className="prompt-original-image"/>}</section>}
      {references.length>0&&<section className="prompt-detail-references" aria-labelledby="references-heading"><h2 id="references-heading">{references.length===1?"Imagem de referência":"Imagens de referência"}</h2><p>Imagens usadas pelo criador para chegar ao resultado.</p><div>{references.map(reference=><figure key={reference.id}><img src={reference.url} alt={reference.label||"Referência do prompt"} loading="lazy"/>{reference.label&&<figcaption>{reference.label}</figcaption>}</figure>)}</div></section>}
     </div>}
    </div>
    <div className="prompt-detail-support">
     <section id="creator" className="prompt-detail-creator" aria-labelledby="creator-heading"><h2 id="creator-heading">Conheça o criador</h2>{creatorProfile?<CreatorLanyard profile={creatorProfile} href={profileHref}/>:<div className="py-8"><CreatorIdentity name={creatorName} avatarUrl={prompt.creatorAvatarUrl} badges={prompt.creatorBadges} href={profileHref}/></div>}{moreByCreator.length>0&&<a href="#creator-prompts" className="prompt-detail-more-creator">Mais prompts deste criador <ArrowRight size={16}/></a>}</section>
     <section className="prompt-detail-how" aria-labelledby="how-to-heading"><h2 id="how-to-heading">Como usar</h2><ol><li><span>1</span><div><h3>Copie o prompt</h3><p>Use o botão acima para copiar o texto completo.</p></div></li><li><span>2</span><div><h3>Abra {prompt.model||"sua ferramenta de IA"}</h3><p>Cole o texto.{before||references.length?" Adicione a referência se a ferramenta permitir.":""}</p></div></li><li><span>3</span><div><h3>Faça do seu jeito</h3><p>Adapte os detalhes ao seu objetivo e gere o resultado.</p></div></li></ol><p className="prompt-detail-disclaimer">Os resultados podem variar conforme o modelo, a versão e as configurações.</p></section>
     <section className="prompt-detail-about" aria-labelledby="about-heading"><h2 id="about-heading">Sobre este prompt</h2><dl>{[["Ferramenta",prompt.model||"Não informada"],["Categoria",prompt.category||"Não informada"],["Acesso",isPrivate?"Sua biblioteca":"Público e gratuito"],["Criado em",formatDate(prompt.createdAt)],...(prompt.updatedAt>prompt.createdAt?[["Atualizado em",formatDate(prompt.updatedAt)]]:[])].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    </div>
   </article>
   {(moreByCreator.length>0||relatedPrompts.length>0)&&<section className="prompt-detail-explore" aria-labelledby="continue-heading"><div className="prompt-detail-explore-heading"><h2 id="continue-heading">Continue explorando</h2><Link href="/explore">Ver todos <ArrowRight size={16}/></Link></div>{moreByCreator.length>0&&<section id="creator-prompts"><h3 className="prompt-detail-recommendation-label">Mais de {creatorName}</h3><div className="prompt-detail-recommendations">{moreByCreator.map(item=><PromptCard key={`${item.creatorId}:${item.id}`} prompt={item}/>)}</div></section>}{relatedPrompts.length>0&&<section><h3 className="prompt-detail-recommendation-label">{prompt.category?`Outros prompts de ${prompt.category}`:"Outros prompts para descobrir"}</h3><div className="prompt-detail-recommendations">{relatedPrompts.map(item=><PromptCard key={`${item.creatorId}:${item.id}`} prompt={item}/>)}</div></section>}</section>}
  </div>
 </main>;
}
