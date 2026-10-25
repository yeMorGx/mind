"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect,useRef,useState } from "react";
import Image from "next/image";
import AIModelPicker from "@/components/models/AIModelPicker";
import PromptVideo from "./PromptVideo";
import {uploadPromptVideo} from "@/lib/prompt-video";
import {promptKindLabels,type PromptKind} from "@/lib/prompt-showcase";
import { X } from "lucide-react";
import type { Prompt } from "@/lib/firebase/data";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { SelectField } from "@/components/ui/SelectField";
import { preparePromptImage,validatePromptDetails,MAX_PROMPT_IMAGES,MAX_IMAGES_CHARS,type PromptDetails,type StoredPromptImage,type PromptImageRole,type PromptCoverMode } from "@/lib/prompt-media";
import { ImageCompare } from "@/components/ui/ImageCompare";
type Props={isOpen:boolean;prompt:Prompt|null;initialTitle?:string;defaults?:{category?:string;model?:string};pending:boolean;error:string;onClose:()=>void;onSave:(title:string,content:string,details:PromptDetails)=>void};
export default function PromptDialog({isOpen,prompt,initialTitle="",defaults,pending,error,onClose,onSave}:Props){
 const { t, intlLocale } = useI18n();

  const [title,setTitle]=useState(prompt?.title??initialTitle),[content,setContent]=useState(prompt?.content??""),[description,setDescription]=useState(prompt?.description??"");
  const [category,setCategory]=useState(prompt?.category??defaults?.category??""),[model,setModel]=useState(prompt?.model??defaults?.model??"");
  const [kind,setKind]=useState<PromptKind>(prompt?.kind??"image"),[summary,setSummary]=useState(prompt?.summary??""),[videoUrl,setVideoUrl]=useState(prompt?.videoUrl??""),[videoPath,setVideoPath]=useState(prompt?.videoPath??""),[siteUrl,setSiteUrl]=useState(prompt?.siteUrl??"");
  const [images,setImages]=useState<StoredPromptImage[]>(prompt?.images??[]);
  const [coverMode,setCoverMode]=useState<PromptCoverMode>(prompt?.coverMode??"auto"),[coverImageId,setCoverImageId]=useState(prompt?.coverImageId??"");
  const [tab,setTab]=useState("text"),[processing,setProcessing]=useState(false),[localError,setLocalError]=useState("");
  const dialog=useRef<HTMLDialogElement>(null),processingRef=useRef(false),submitting=useRef(false);
  const locked=pending||processing;
  const beforeImage=images.find(image=>image.role==="before"),afterImage=images.find(image=>image.role==="after");
  const coverImages=images.filter(image=>image.role!=="reference");
  const automaticCover=coverImages.find(image=>image.role==="gallery"||image.role==="after")??coverImages[0];
  const hasBeforeAfter=Boolean(beforeImage&&afterImage);
  const hasSelectedCover=coverImages.some(image=>image.id===coverImageId);
  const effectiveCoverMode:PromptCoverMode=coverMode==="image"&&hasSelectedCover?"image":coverMode==="compare"&&hasBeforeAfter?"compare":"auto";
  const effectiveCoverImageId=effectiveCoverMode==="image"?coverImageId:"";
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
  function updateImageSet(update:(current:StoredPromptImage[])=>StoredPromptImage[]){
    const next=update(images);
    setImages(next);
    const nextCoverStillExists=next.some(image=>image.id===coverImageId&&image.role!=="reference");
    const nextHasComparison=next.some(image=>image.role==="before")&&next.some(image=>image.role==="after");
    if(coverMode==="image"&&!nextCoverStillExists){setCoverMode("auto");setCoverImageId("");}
    if(coverMode==="compare"&&!nextHasComparison){setCoverMode("auto");setCoverImageId("");}
  }
  return <dialog ref={dialog} className="prompt-editor" data-tab={tab} aria-labelledby="prompt-dialog-title" onCancel={event=>{event.preventDefault();if(!locked)onClose();}}>
    <form noValidate onSubmit={event=>{event.preventDefault();if(locked||processingRef.current||submitting.current)return;const details={description,category,model,images,kind,summary,videoUrl:kind==="video"?videoUrl:"",videoPath:kind==="video"?videoPath:"",siteUrl:kind==="website"?siteUrl:"",coverMode:effectiveCoverMode,coverImageId:effectiveCoverImageId};try{validatePromptDetails(title,content,details);setLocalError("");submitting.current=true;onSave(title,content,details);}catch(failure){submitting.current=false;const message=failure instanceof Error?failure.message:"Confira os dados do prompt.";setTab(message.includes("capa")||message.includes("Antes")?"images":"text");setLocalError(message);}}}>
      <header className="prompt-editor-header"><div><h2 id="prompt-dialog-title">{prompt?t("Editar prompt"):t("Novo prompt")}</h2><p>{prompt?.isPublished?t("Este prompt é público. Salvar atualiza sua publicação."):t("Salve na biblioteca. Você pode revisar e publicar depois.")}</p></div><button type="button" aria-label={t("Fechar editor de prompt")} disabled={locked} onClick={onClose}><X size={22}/></button></header>
      <div className="prompt-editor-tabs" aria-label={t("Seções do editor")}><button type="button" aria-pressed={tab==="text"} onClick={()=>setTab("text")}>{t("Texto e detalhes")}</button><button type="button" aria-pressed={tab==="images"} onClick={()=>setTab("images")}>{t("Imagens ·")}{" "}{images.length}</button></div>
      <div className="prompt-editor-body">
        <section className="prompt-editor-primary" aria-label={t("Texto e detalhes do prompt")}>
          <SelectField label={t("Tipo de prompt")} value={kind} disabled={locked} onValueChange={value=>{const next=value as PromptKind;setKind(next);if(!category||["Imagem","Site","Vídeo"].includes(category))setCategory(next==="website"?"Site":next==="video"?"Vídeo":"Imagem")}} options={Object.entries(promptKindLabels).map(([value,label])=>({value,label}))}/>
          <label>{t("Título")}<input autoFocus required maxLength={120} value={title} onChange={event=>setTitle(event.target.value)} placeholder={t("Ex.: Retrato com luz de estúdio")} disabled={locked}/></label>
          <div className="prompt-editor-metadata"><label>{t("Categoria")}<input maxLength={80} value={category} onChange={event=>setCategory(event.target.value)} placeholder={t("Ex.: Retratos")} disabled={locked}/></label><AIModelPicker value={model} onChange={setModel} disabled={locked}/></div>
          <label>{t("Descrição breve do card")}<input maxLength={180} value={summary} onChange={event=>setSummary(event.target.value)} placeholder={t("Resuma o que este prompt cria em uma frase.")} disabled={locked}/><span className="prompt-editor-count">{summary.length}/180</span></label>
          {kind==="website"&&<label>{t("Link do site gerado (opcional)")}<input type="url" maxLength={2048} placeholder="https://seu-site.com" value={siteUrl} disabled={locked} onChange={event=>setSiteUrl(event.target.value)}/></label>}
          <label className="prompt-editor-content">{t("Prompt")}<textarea required maxLength={20000} value={content} onChange={event=>setContent(event.target.value)} placeholder={t("Escreva ou cole seu prompt…")} disabled={locked}/><span className="prompt-editor-count">{content.length.toLocaleString(intlLocale)} / 20.000</span></label>
          <label>{t("Descrição e como usar")}<textarea rows={3} maxLength={500} value={description} onChange={event=>setDescription(event.target.value)} placeholder={t("Explique o resultado e como usar o prompt.")} disabled={locked}/></label>
        </section>
        <section className="prompt-editor-assets" aria-labelledby="prompt-images-heading"><div className="flex items-center justify-between gap-3"><h3 id="prompt-images-heading" className="font-semibold">{t("Imagens do prompt")}</h3><span className="text-xs text-muted">{images.length}/{MAX_PROMPT_IMAGES}</span></div><p className="my-3 text-sm leading-6 text-muted">{t("Até 8 imagens no total, entre resultados, comparação e referências.")}</p>
          {kind==="video"&&<section className="prompt-editor-video-section"><h4>{t("Vídeo de resultado")}</h4><p>{t("Anexe um MP4 ou WebM de até 30 MB. O card reproduz ao passar o mouse.")}</p><label className="workflow-button secondary">{processing?t("Enviando…"):videoPath?t("Trocar vídeo"):t("Anexar vídeo")}<input type="file" className="sr-only" accept="video/mp4,video/webm" disabled={locked} onChange={async event=>{const file=event.target.files?.[0];event.target.value="";if(!file||processingRef.current)return;processingRef.current=true;setProcessing(true);setLocalError("");try{const path=await uploadPromptVideo(file);setVideoPath(path);setVideoUrl("");}catch(error){setLocalError(error instanceof Error?error.message:"Não foi possível enviar o vídeo.");}finally{processingRef.current=false;setProcessing(false);}}}/></label>{(videoPath||videoUrl)&&<><PromptVideo path={videoPath} url={videoUrl}/><button type="button" disabled={locked} className="profile-text-action" onClick={()=>{setVideoPath("");setVideoUrl("")}}>{t("Remover vídeo")}</button></>}</section>}
          {([false,true] as const).map(isReference=><section key={String(isReference)} className="prompt-editor-asset-section" aria-labelledby={isReference?"prompt-reference-heading":"prompt-results-heading"}>
          <h4 id={isReference?"prompt-reference-heading":"prompt-results-heading"}>{isReference?t("Imagens de referência (opcional)"):t("Resultados e comparação")}</h4>
          <p>{isReference?t("Anexe a imagem base que será usada junto com o prompt, como um modelo com a pessoa a substituir. Quem abrir sua publicação poderá baixar as referências nesta ordem."):t("Mostre o que o prompt gera. Para comparar, marque uma imagem como Antes e outra como Depois.")}</p>
          <UploadDropzone onFiles={files=>addImages(files,isReference?"reference":"gallery")} label={isReference?t("Adicionar imagens de referência"):t("Adicionar imagens de resultado")} disabled={locked} remaining={MAX_PROMPT_IMAGES-images.length}/>
          <div className="prompt-editor-image-grid">{images.filter(image=>(image.role==="reference")===isReference).map((image,index)=><div key={image.id} className="prompt-editor-image">
            {/* eslint-disable-next-line @next/next/no-img-element -- Local optimized image data URLs. */}
            <img src={image.url} alt={image.label||t("Imagem do prompt")}/><div>{isReference&&<span className="text-xs font-medium">{t("Referência")}{" "}{index+1}</span>}<input aria-label={isReference?t("Descrição da referência {v0}", {v0: (index+1)}):t("Legenda da imagem")} placeholder={isReference?t("Ex.: Imagem base com a silhueta"):t("Legenda")} disabled={locked} maxLength={120} value={image.label} onChange={event=>setImages(current=>current.map(item=>item.id===image.id?{...item,label:event.target.value}:item))}/><SelectField label={t("Função da imagem")} hideLabel className="prompt-image-role-select" value={image.role} disabled={locked} onValueChange={value=>{const role=value as PromptImageRole;updateImageSet(current=>current.map(item=>item.id===image.id?{...item,role}:(role==="before"||role==="after")&&item.role===role?{...item,role:"gallery"}:item));}} options={[{value:"gallery",label:t("Resultado")},{value:"reference",label:t("Referência")},{value:"before",label:t("Antes")},{value:"after",label:t("Depois")}]}/><button type="button" disabled={locked} aria-label={isReference?t("Remover referência {v0}", {v0: (index+1)}):undefined} onClick={()=>updateImageSet(current=>current.filter(item=>item.id!==image.id))}>{t("Remover")}</button></div>
          </div>)}</div>
          </section>)}
          <section className="prompt-editor-asset-section" aria-labelledby="prompt-cover-heading">
            <h4 id="prompt-cover-heading">{t("Capa do card")}</h4>
            <p>{t("Escolha a imagem que aparece no card do prompt. A opção automática mantém a seleção padrão.")}</p>
            <div className="prompt-editor-cover-picker" role="group" aria-label={t("Escolher capa")}>
              <button type="button" className="prompt-editor-cover-choice" aria-pressed={effectiveCoverMode==="auto"} disabled={locked} onClick={()=>{setCoverMode("auto");setCoverImageId("");}}>
                <span className={`prompt-editor-cover-choice-preview${automaticCover?"":" prompt-editor-cover-auto"}`}>
                  {automaticCover&&<Image unoptimized src={automaticCover.url} alt="" width={160} height={120}/>}
                  {!automaticCover&&<span>{t("Automática")}</span>}
                </span>
                <span>{t("Automática")}</span>
              </button>
              {coverImages.map((image,index)=><button key={image.id} type="button" className="prompt-editor-cover-choice" aria-pressed={effectiveCoverMode==="image"&&effectiveCoverImageId===image.id} disabled={locked} onClick={()=>{setCoverMode("image");setCoverImageId(image.id);}}>
                <span className="prompt-editor-cover-choice-preview">
                  <Image unoptimized src={image.url} alt="" width={160} height={120}/>
                </span>
                <span>{image.label||t("Imagem {v0}",{v0:index+1})}</span>
              </button>)}
              {beforeImage&&afterImage&&<button type="button" className="prompt-editor-cover-choice" aria-pressed={effectiveCoverMode==="compare"} disabled={locked} onClick={()=>{setCoverMode("compare");setCoverImageId("");}}>
                <span className="prompt-editor-cover-choice-preview"><ImageCompare beforeSrc={beforeImage.url} afterSrc={afterImage.url} beforeAlt="" afterAlt="" interactive={false} labels/></span>
                <span>{t("Antes e depois")}</span>
              </button>}
            </div>
            {effectiveCoverMode==="compare"&&<p className="prompt-editor-cover-note">{t("A comparação interativa aparece no prompt. O card mostra a prévia antes/depois.")}</p>}
          </section>
        </section>
      </div>
      <footer className="prompt-editor-footer"><div role="status" className={localError||error?"text-sm text-red-700":"text-sm text-muted"}>{localError||error||(processing?t("Preparando arquivos…"):prompt?.isPublished?t("As alterações serão públicas ao salvar."):t("A publicação é uma etapa separada."))}</div><div><button type="button" disabled={locked} onClick={onClose} className="editor-cancel">{t("Cancelar")}</button><button type="submit" disabled={locked||!title.trim()||!content.trim()} className="editor-save">{pending?t("Salvando…"):prompt?t("Salvar alterações"):t("Salvar na biblioteca")}</button></div></footer>
    </form>
  </dialog>;
}
