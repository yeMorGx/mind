"use client";
import { useEffect,useRef,useState } from "react";
import AIModelPicker from "@/components/models/AIModelPicker";
import { X } from "lucide-react";
import type { Prompt } from "@/lib/firebase/data";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { preparePromptImage,validatePromptDetails,MAX_PROMPT_IMAGES,MAX_IMAGES_CHARS,type PromptDetails,type StoredPromptImage,type PromptImageRole } from "@/lib/prompt-media";
type Props={isOpen:boolean;prompt:Prompt|null;initialTitle?:string;defaults?:{category?:string;model?:string};pending:boolean;error:string;onClose:()=>void;onSave:(title:string,content:string,details:PromptDetails)=>void};
export default function PromptDialog({isOpen,prompt,initialTitle="",defaults,pending,error,onClose,onSave}:Props){
  const [title,setTitle]=useState(prompt?.title??initialTitle),[content,setContent]=useState(prompt?.content??""),[description,setDescription]=useState(prompt?.description??"");
  const [category,setCategory]=useState(prompt?.category??defaults?.category??""),[model,setModel]=useState(prompt?.model??defaults?.model??"");
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
  async function addImages(files:File[]){
    processingRef.current=true;setProcessing(true);
    try{const prepared=await Promise.all(files.map(preparePromptImage));const next=[...images,...prepared];if(next.length>MAX_PROMPT_IMAGES||next.reduce((size,image)=>size+image.url.length,0)>MAX_IMAGES_CHARS)throw new Error("As imagens juntas estão muito grandes. Remova algumas ou escolha versões menores.");setImages(next);setLocalError("");}
    finally{processingRef.current=false;setProcessing(false);}
  }
  return <dialog ref={dialog} className="prompt-editor" data-tab={tab} aria-labelledby="prompt-dialog-title" onCancel={event=>{event.preventDefault();if(!locked)onClose();}}>
    <form noValidate onSubmit={event=>{event.preventDefault();if(locked||processingRef.current||submitting.current)return;const details={description,category,model,images};try{validatePromptDetails(title,content,details);setLocalError("");submitting.current=true;onSave(title,content,details);}catch(failure){submitting.current=false;setTab("text");setLocalError(failure instanceof Error?failure.message:"Confira os dados do prompt.");}}}>
      <header className="prompt-editor-header"><div><h2 id="prompt-dialog-title">{prompt?"Editar prompt":"Novo prompt"}</h2><p>{prompt?.isPublished?"Este prompt é público. Salvar atualiza sua publicação.":"Salve na biblioteca. Você pode revisar e publicar depois."}</p></div><button type="button" aria-label="Fechar editor de prompt" disabled={locked} onClick={onClose}><X size={22}/></button></header>
      <div className="prompt-editor-tabs" aria-label="Seções do editor"><button type="button" aria-pressed={tab==="text"} onClick={()=>setTab("text")}>Texto e detalhes</button><button type="button" aria-pressed={tab==="images"} onClick={()=>setTab("images")}>Imagens · {images.length}</button></div>
      <div className="prompt-editor-body">
        <section className="prompt-editor-primary" aria-label="Texto e detalhes do prompt">
          <label>Título<input autoFocus required maxLength={120} value={title} onChange={event=>setTitle(event.target.value)} placeholder="Ex.: Retrato com luz de estúdio" disabled={locked}/></label>
          <div className="prompt-editor-metadata"><label>Categoria<input maxLength={80} value={category} onChange={event=>setCategory(event.target.value)} placeholder="Ex.: Retratos" disabled={locked}/></label><AIModelPicker value={model} onChange={setModel} disabled={locked}/></div>
          <label className="prompt-editor-content">Prompt<textarea required maxLength={20000} value={content} onChange={event=>setContent(event.target.value)} placeholder="Escreva ou cole seu prompt…" disabled={locked}/><span className="prompt-editor-count">{content.length.toLocaleString("pt-BR")} / 20.000</span></label>
          <label>Descrição e como usar<textarea rows={3} maxLength={500} value={description} onChange={event=>setDescription(event.target.value)} placeholder="Explique o resultado e como usar o prompt." disabled={locked}/></label>
        </section>
        <section className="prompt-editor-assets" aria-labelledby="prompt-images-heading"><div className="flex items-center justify-between gap-3"><h3 id="prompt-images-heading" className="font-semibold">Imagens do prompt</h3><span className="text-xs text-muted">{images.length}/{MAX_PROMPT_IMAGES}</span></div><p className="my-3 text-sm leading-6 text-muted">Inclua resultados, referências ou um antes e depois.</p>
          <UploadDropzone onFiles={addImages} disabled={locked} remaining={MAX_PROMPT_IMAGES-images.length}/>
          <div className="prompt-editor-image-grid">{images.map(image=><div key={image.id} className="prompt-editor-image">
            {/* eslint-disable-next-line @next/next/no-img-element -- Local optimized image data URLs. */}
            <img src={image.url} alt={image.label||"Imagem do prompt"}/><div><input aria-label="Legenda da imagem" disabled={locked} maxLength={120} value={image.label} onChange={event=>setImages(current=>current.map(item=>item.id===image.id?{...item,label:event.target.value}:item))}/><select aria-label="Função da imagem" disabled={locked} value={image.role} onChange={event=>{const role=event.target.value as PromptImageRole;setImages(current=>current.map(item=>item.id===image.id?{...item,role}:(role==="before"||role==="after")&&item.role===role?{...item,role:"gallery"}:item));}}><option value="gallery">Resultado</option><option value="reference">Referência</option><option value="before">Antes</option><option value="after">Depois</option></select><button type="button" disabled={locked} onClick={()=>setImages(current=>current.filter(item=>item.id!==image.id))}>Remover</button></div>
          </div>)}</div>
        </section>
      </div>
      <footer className="prompt-editor-footer"><div role="status" className={localError||error?"text-sm text-red-700":"text-sm text-muted"}>{localError||error||(processing?"Preparando imagens…":prompt?.isPublished?"As alterações serão públicas ao salvar.":"A publicação é uma etapa separada.")}</div><div><button type="button" disabled={locked} onClick={onClose} className="editor-cancel">Cancelar</button><button type="submit" disabled={locked||!title.trim()||!content.trim()} className="editor-save">{pending?"Salvando…":prompt?"Salvar alterações":"Salvar na biblioteca"}</button></div></footer>
    </form>
  </dialog>;
}
