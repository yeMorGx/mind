"use client";
import { useEffect,useRef,useState } from "react";
import AIModelPicker from "@/components/models/AIModelPicker";
import PromptVideo from "./PromptVideo";
import {uploadPromptVideo} from "@/lib/prompt-video";
import {promptKindLabels,type PromptKind} from "@/lib/prompt-showcase";
import { X } from "lucide-react";
import type { Prompt } from "@/lib/firebase/data";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { SelectField } from "@/components/ui/SelectField";
import { preparePromptImage,validatePromptDetails,MAX_PROMPT_IMAGES,MAX_IMAGES_CHARS,type PromptDetails,type StoredPromptImage,type PromptImageRole } from "@/lib/prompt-media";
type Props={isOpen:boolean;prompt:Prompt|null;initialTitle?:string;defaults?:{category?:string;model?:string};pending:boolean;error:string;onClose:()=>void;onSave:(title:string,content:string,details:PromptDetails)=>void};
export default function PromptDialog({isOpen,prompt,initialTitle="",defaults,pending,error,onClose,onSave}:Props){
  const [title,setTitle]=useState(prompt?.title??initialTitle),[content,setContent]=useState(prompt?.content??""),[description,setDescription]=useState(prompt?.description??"");
  const [category,setCategory]=useState(prompt?.category??defaults?.category??""),[model,setModel]=useState(prompt?.model??defaults?.model??"");
  const [kind,setKind]=useState<PromptKind>(prompt?.kind??"image"),[summary,setSummary]=useState(prompt?.summary??""),[videoUrl,setVideoUrl]=useState(prompt?.videoUrl??""),[videoPath,setVideoPath]=useState(prompt?.videoPath??""),[siteUrl,setSiteUrl]=useState(prompt?.siteUrl??"");
  const [images,setImages]=useState<StoredPromptImage[]>(prompt?.images??[]);
  const [tab,setTab]=useState("text"),[processing,setProcessing]=useState(false),[localError,setLocalError]=useState("");
  const dialog=useRef<HTMLDialogElement>(null),processingRef=useRef(false),submitting=useRef(false);
  const locked=pending||processing;
  useEffect(()=>{if(!pending)submitting.current=false;},[pending]);
  useEffect(()=>{
    const element=dialog.current;if(!element)return;
    if(!isOpen){element.close();return;}
    const previous=document.body.style.overflow;document.body.style.overflow="hidden";
    if(!element.open)element.showModal();
    return()=>{element.close();document.body.style.overflow=previous;};
  },[isOpen]);
  async function addImages(files:File[],role:PromptImageRole="gallery"){
    if(processingRef.current||pending)return;
    processingRef.current=true;setProcessing(true);
    try{const prepared=await Promise.all(files.map(preparePromptImage));const next=[...images,...prepared.map(image=>({...image,role}))];if(next.length>MAX_PROMPT_IMAGES||next.reduce((size,image)=>size+image.url.length,0)>MAX_IMAGES_CHARS)throw new Error("As imagens juntas estão muito grandes. Remova algumas ou escolha versões menores.");setImages(next);setLocalError("");}
    finally{processingRef.current=false;setProcessing(false);}
  }
  return <dialog ref={dialog} className="prompt-editor" data-tab={tab} aria-labelledby="prompt-dialog-title" onCancel={event=>{event.preventDefault();if(!locked)onClose();}}>
    <form noValidate onSubmit={event=>{event.preventDefault();if(locked||processingRef.current||submitting.current)return;const details={description,category,model,images,kind,summary,videoUrl:kind==="video"?videoUrl:"",videoPath:kind==="video"?videoPath:"",siteUrl:kind==="website"?siteUrl:""};try{validatePromptDetails(title,content,details);setLocalError("");submitting.current=true;onSave(title,content,details);}catch(failure){submitting.current=false;setTab("text");setLocalError(failure instanceof Error?failure.message:"Confira os dados do prompt.");}}}>
      <header className="prompt-editor-header"><div><h2 id="prompt-dialog-title">{prompt?"Editar prompt":"Novo prompt"}</h2><p>{prompt?.isPublished?"Este prompt é público. Salvar atualiza sua publicação.":"Salve na biblioteca. Você pode revisar e publicar depois."}</p></div><button type="button" aria-label="Fechar editor de prompt" disabled={locked} onClick={onClose}><X size={22}/></button></header>
      <div className="prompt-editor-tabs" aria-label="Seções do editor"><button type="button" aria-pressed={tab==="text"} onClick={()=>setTab("text")}>Texto e detalhes</button><button type="button" aria-pressed={tab==="images"} onClick={()=>setTab("images")}>Imagens · {images.length}</button></div>
      <div className="prompt-editor-body">
        <section className="prompt-editor-primary" aria-label="Texto e detalhes do prompt">
          <SelectField label="Tipo de prompt" value={kind} disabled={locked} onValueChange={value=>{const next=value as PromptKind;setKind(next);if(!category||["Imagem","Site","Vídeo"].includes(category))setCategory(next==="website"?"Site":next==="video"?"Vídeo":"Imagem")}} options={Object.entries(promptKindLabels).map(([value,label])=>({value,label}))}/>
          <label>Título<input autoFocus required maxLength={120} value={title} onChange={event=>setTitle(event.target.value)} placeholder="Ex.: Retrato com luz de estúdio" disabled={locked}/></label>
          <div className="prompt-editor-metadata"><label>Categoria<input maxLength={80} value={category} onChange={event=>setCategory(event.target.value)} placeholder="Ex.: Retratos" disabled={locked}/></label><AIModelPicker value={model} onChange={setModel} disabled={locked}/></div>
          <label>Descrição breve do card<input maxLength={180} value={summary} onChange={event=>setSummary(event.target.value)} placeholder="Resuma o que este prompt cria em uma frase." disabled={locked}/><span className="prompt-editor-count">{summary.length}/180</span></label>
          {kind==="website"&&<label>Link do site gerado (opcional)<input type="url" maxLength={2048} placeholder="https://seu-site.com" value={siteUrl} disabled={locked} onChange={event=>setSiteUrl(event.target.value)}/></label>}
          <label className="prompt-editor-content">Prompt<textarea required maxLength={20000} value={content} onChange={event=>setContent(event.target.value)} placeholder="Escreva ou cole seu prompt…" disabled={locked}/><span className="prompt-editor-count">{content.length.toLocaleString("pt-BR")} / 20.000</span></label>
          <label>Descrição e como usar<textarea rows={3} maxLength={500} value={description} onChange={event=>setDescription(event.target.value)} placeholder="Explique o resultado e como usar o prompt." disabled={locked}/></label>
        </section>
        <section className="prompt-editor-assets" aria-labelledby="prompt-images-heading"><div className="flex items-center justify-between gap-3"><h3 id="prompt-images-heading" className="font-semibold">Imagens do prompt</h3><span className="text-xs text-muted">{images.length}/{MAX_PROMPT_IMAGES}</span></div><p className="my-3 text-sm leading-6 text-muted">Até 8 imagens no total, entre resultados, comparação e referências.</p>
          {kind==="video"&&<section className="prompt-editor-video-section"><h4>Vídeo de resultado</h4><p>Anexe um MP4 ou WebM de até 30 MB. O card reproduz ao passar o mouse.</p><label className="workflow-button secondary">{processing?"Enviando…":videoPath?"Trocar vídeo":"Anexar vídeo"}<input type="file" className="sr-only" accept="video/mp4,video/webm" disabled={locked} onChange={async event=>{const file=event.target.files?.[0];event.target.value="";if(!file||processingRef.current)return;processingRef.current=true;setProcessing(true);setLocalError("");try{const path=await uploadPromptVideo(file);setVideoPath(path);setVideoUrl("");}catch(error){setLocalError(error instanceof Error?error.message:"Não foi possível enviar o vídeo.");}finally{processingRef.current=false;setProcessing(false);}}}/></label>{(videoPath||videoUrl)&&<><PromptVideo path={videoPath} url={videoUrl}/><button type="button" disabled={locked} className="profile-text-action" onClick={()=>{setVideoPath("");setVideoUrl("")}}>Remover vídeo</button></>}</section>}
          {([false,true] as const).map(isReference=><section key={String(isReference)} className="prompt-editor-asset-section" aria-labelledby={isReference?"prompt-reference-heading":"prompt-results-heading"}>
          <h4 id={isReference?"prompt-reference-heading":"prompt-results-heading"}>{isReference?"Imagens de referência (opcional)":"Resultados e comparação"}</h4>
          <p>{isReference?"Anexe a imagem base que será usada junto com o prompt, como um modelo com a pessoa a substituir. Quem abrir sua publicação poderá baixar as referências nesta ordem.":"Mostre o que o prompt gera. Para comparar, marque uma imagem como Antes e outra como Depois."}</p>
          <UploadDropzone onFiles={files=>addImages(files,isReference?"reference":"gallery")} label={isReference?"Adicionar imagens de referência":"Adicionar imagens de resultado"} disabled={locked} remaining={MAX_PROMPT_IMAGES-images.length}/>
          <div className="prompt-editor-image-grid">{images.filter(image=>(image.role==="reference")===isReference).map((image,index)=><div key={image.id} className="prompt-editor-image">
            {/* eslint-disable-next-line @next/next/no-img-element -- Local optimized image data URLs. */}
            <img src={image.url} alt={image.label||"Imagem do prompt"}/><div>{isReference&&<span className="text-xs font-medium">Referência {index+1}</span>}<input aria-label={isReference?`Descrição da referência ${index+1}`:"Legenda da imagem"} placeholder={isReference?"Ex.: Imagem base com a silhueta":"Legenda"} disabled={locked} maxLength={120} value={image.label} onChange={event=>setImages(current=>current.map(item=>item.id===image.id?{...item,label:event.target.value}:item))}/><SelectField label="Função da imagem" hideLabel className="prompt-image-role-select" value={image.role} disabled={locked} onValueChange={value=>{const role=value as PromptImageRole;setImages(current=>current.map(item=>item.id===image.id?{...item,role}:(role==="before"||role==="after")&&item.role===role?{...item,role:"gallery"}:item));}} options={[{value:"gallery",label:"Resultado"},{value:"reference",label:"Referência"},{value:"before",label:"Antes"},{value:"after",label:"Depois"}]}/><button type="button" disabled={locked} aria-label={isReference?`Remover referência ${index+1}`:undefined} onClick={()=>setImages(current=>current.filter(item=>item.id!==image.id))}>Remover</button></div>
          </div>)}</div>
          </section>)}
        </section>
      </div>
      <footer className="prompt-editor-footer"><div role="status" className={localError||error?"text-sm text-red-700":"text-sm text-muted"}>{localError||error||(processing?"Preparando arquivos…":prompt?.isPublished?"As alterações serão públicas ao salvar.":"A publicação é uma etapa separada.")}</div><div><button type="button" disabled={locked} onClick={onClose} className="editor-cancel">Cancelar</button><button type="submit" disabled={locked||!title.trim()||!content.trim()} className="editor-save">{pending?"Salvando…":prompt?"Salvar alterações":"Salvar na biblioteca"}</button></div></footer>
    </form>
  </dialog>;
}
