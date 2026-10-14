"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,Check,Copy,Globe,LockKeyhole} from "lucide-react";
import {useOnboarding} from "@/app/context/OnboardingContext";
import {useSiteLayout} from "@/components/layout/SiteLayout";
import {getPrompt,type Prompt} from "@/lib/firebase/data";
import {getOwnProfile,setPromptPublication,type CreatorProfile} from "@/lib/firebase/publication";
import {validatePromptDetails} from "@/lib/prompt-media";
export default function PublishPromptPage({promptId}:{promptId:string}){
 const {user,authReady,profileLoading,data}=useOnboarding();
 const {requestLogin}=useSiteLayout();
 const [attempt,setAttempt]=useState(0);
 const [loaded,setLoaded]=useState<{key:string;prompt:Prompt|null;profile:CreatorProfile|null;error:boolean}|null>(null);
 const [step,setStep]=useState<"review"|"confirm"|"done">("review");
 const [pending,setPending]=useState(false),[error,setError]=useState(""),[copyNotice,setCopyNotice]=useState("");
 const [published,setPublished]=useState(false);
 const busy=useRef(false);
 const workspace=data.primaryWorkspaceId,key=`${user?.uid}:${workspace}:${promptId}:${attempt}`;
 useEffect(()=>{
  if(!user||!authReady||profileLoading||!workspace)return;
  let alive=true;
  void Promise.all([getPrompt(workspace,promptId),getOwnProfile(user.uid)]).then(([prompt,profile])=>{if(alive)setLoaded({key,prompt,profile,error:false});}).catch(()=>{if(alive)setLoaded({key,prompt:null,profile:null,error:true});});
  return()=>{alive=false;};
 },[user,authReady,profileLoading,workspace,promptId,key]);
 if(!authReady||profileLoading)return <main className="workflow-page"><p role="status">Carregando…</p></main>;
 if(!user)return <main className="workflow-page"><h1>Entre para publicar</h1><p className="workflow-intro">Sua biblioteca fica protegida na sua conta.</p><button className="workflow-button mt-6" onClick={requestLogin}>Entrar</button></main>;
 if(!data.onboardingComplete||!workspace)return <main className="workflow-page"><h1>Conclua sua conta</h1><Link href="/register/step-2" className="workflow-button mt-6">Continuar cadastro</Link></main>;
 if(loaded?.key!==key)return <main className="workflow-page"><p role="status">Carregando publicação…</p></main>;
 if(loaded.error||!loaded.prompt)return <main className="workflow-page"><h1>{loaded.error?"Não conseguimos carregar o prompt":"Prompt não encontrado"}</h1><p className="workflow-intro">{loaded.error?"Confira sua conexão e tente novamente.":"Este prompt não está na sua biblioteca."}</p><div className="workflow-actions">{loaded.error&&<button className="workflow-button" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button>}<Link href="/home" className="workflow-button secondary">Voltar à biblioteca</Link></div></main>;
 const prompt=loaded.prompt;
 async function confirm(){
  if(busy.current||!user||!workspace)return;
  busy.current=true;setPending(true);setError("");
  try{
   const fresh=await getPrompt(workspace,promptId);
   if(!fresh)throw new Error("Este prompt foi removido. Volte à biblioteca.");
   if(JSON.stringify(fresh)!==JSON.stringify(prompt)){setStep("review");setAttempt(value=>value+1);throw new Error("O prompt mudou desde a revisão. Confira a versão atual antes de continuar.");}
   if(!prompt.isPublished)validatePromptDetails(prompt.title,prompt.content,prompt);
   await setPromptPublication(workspace,user.uid,promptId,!prompt.isPublished);
   setPublished(!prompt.isPublished);setStep("done");
  }catch(failure){setError(failure instanceof Error?failure.message:"Não foi possível atualizar a publicação. Tente novamente.");}
  finally{busy.current=false;setPending(false);}
 }
 const sharePath=`/share/${encodeURIComponent(user.uid)}/${encodeURIComponent(promptId)}`;
 return <main className="workflow-page">
  <Link href="/home" className="workflow-back"><ArrowLeft size={16}/>Voltar à biblioteca</Link>
  <h1>{step==="done"?(published?"Seu prompt está no ar":"Publicação retirada"):prompt.isPublished?"Gerenciar publicação":"Prepare sua publicação"}</h1>
  {step!=="done"&&<><p className="workflow-intro">{prompt.isPublished?"Seu prompt já aparece no seu perfil e pode ser acessado pelo link público.":"Confira o que seus seguidores vão encontrar antes de tornar o prompt público."}</p><ol className="workflow-steps" aria-label="Etapas da publicação"><li aria-current={step==="review"?"step":undefined}>1. Revisar</li><li aria-current={step==="confirm"?"step":undefined}>2. Confirmar</li><li>{prompt.isPublished?"3. Concluir":"3. Compartilhar"}</li></ol></>}
  {step==="done"?<section className="workflow-panel mt-8 max-w-2xl"><div className="flex items-center gap-3">{published?<Check size={24}/>:<LockKeyhole size={24}/>}<h2>{published?"Pronto para compartilhar":"Disponível só na sua biblioteca"}</h2></div><p className="mt-4 text-sm text-muted">{published?"A publicação aparece no seu perfil público. Compartilhe o link com seus seguidores.":"O link público deixa de mostrar este prompt. O rascunho e as imagens continuam salvos."}</p>{published&&<><label className="mt-5 block text-sm">Link do prompt<input readOnly className="share-link-input" value={typeof window!=="undefined"?`${window.location.origin}${sharePath}`:sharePath} onFocus={event=>event.target.select()}/></label><button className="workflow-button secondary mt-4" onClick={async()=>{try{await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);setCopyNotice("Link copiado.");}catch{setCopyNotice("Selecione o link acima para copiar.");}}}><Copy size={16}/>Copiar link</button><p role="status" className="mt-2 text-sm text-muted">{copyNotice}</p></>}<div className="workflow-actions"><Link href="/home" className="workflow-button">Voltar à biblioteca</Link><Link href={`/u/${user.uid}`} className="workflow-button secondary">Meu perfil</Link></div></section>:
  <div className="workflow-grid"><PublicationReview prompt={prompt} creatorName={loaded.profile?.name||data.name||"Seu perfil"}/><aside className="workflow-panel"><div className="mb-4 text-muted">{prompt.isPublished?<Globe size={24}/>:<LockKeyhole size={24}/>}</div><h2>{step==="confirm"?(prompt.isPublished?"Retirar do público?":"Tudo pronto para publicar?"):"Controle da publicação"}</h2><p className="mt-3 text-sm text-muted">{step==="confirm"?(prompt.isPublished?"O prompt sai do seu perfil público e deixa de estar disponível pelo link. Você pode publicar novamente depois.":"Qualquer pessoa poderá ver e copiar o texto e acessar todas as imagens desta revisão. Seu perfil é público; seus outros prompts continuam com a visibilidade que você escolheu."):prompt.isPublished?"Para alterar texto e imagens, edite o prompt. Você também pode retirar esta publicação.":"Só este prompt ficará público. Você pode editar ou retirar a publicação depois."}</p>
  <div className="workflow-actions">{step==="review"?<><button className="workflow-button" onClick={()=>{setError("");setStep("confirm");}}>{prompt.isPublished?"Retirar publicação":"Continuar"}</button><Link href={`/home/prompts/${encodeURIComponent(promptId)}?edit=1`} className="workflow-button secondary">Editar prompt</Link></>:<><button className="workflow-button" disabled={pending} onClick={()=>void confirm()}>{pending?"Atualizando…":prompt.isPublished?"Confirmar retirada":"Publicar prompt"}</button><button disabled={pending} className="workflow-button secondary" onClick={()=>setStep("review")}>Voltar à revisão</button></>}</div><p role="alert" className="mt-4 text-sm leading-6 text-red-700">{error}</p></aside></div>}
 </main>;
}
export function PublicationReview({prompt,creatorName}:{prompt:Prompt;creatorName:string}){
 const roles={gallery:"Resultado",reference:"Referência",before:"Antes",after:"Depois"};
 return <section className="workflow-panel"><h2 className="break-words">{prompt.title}</h2><p className="mt-2 text-sm text-muted">por {creatorName}</p>{(prompt.category||prompt.model)&&<p className="mt-4 text-xs text-muted">{[prompt.category,prompt.model].filter(Boolean).join(" · ")}</p>}{prompt.description&&<p className="mt-5 whitespace-pre-wrap text-sm text-muted">{prompt.description}</p>}<h3 className="mt-6 text-sm font-semibold">Texto do prompt</h3><pre className="review-text">{prompt.content}</pre><h3 className="mt-6 text-sm font-semibold">Imagens que serão públicas · {prompt.images.length}</h3>{prompt.images.length?<div className="review-images">{prompt.images.map(image=><figure key={image.id}>
 {/* eslint-disable-next-line @next/next/no-img-element -- Own optimized prompt images. */}
 <img src={image.url} alt={image.label||roles[image.role]}/><figcaption>{roles[image.role]}{image.label?` · ${image.label}`:""}</figcaption></figure>)}</div>:<p className="mt-3 text-sm text-muted">Este prompt será publicado sem imagens.</p>}</section>;
}
