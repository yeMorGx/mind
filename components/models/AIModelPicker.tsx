"use client";
import {useEffect,useId,useRef,useState,type CSSProperties} from "react";
import {Check,ChevronDown,Search} from "lucide-react";
import {AI_MODELS} from "@/lib/ai-models";
import AIModelLogo from "./AIModelLogo";
export default function AIModelPicker({value,onChange,disabled=false,label="Modelo / ferramenta"}:{value:string;onChange:(value:string)=>void;disabled?:boolean;label?:string}){
 const id=useId(),panel=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),search=useRef<HTMLInputElement>(null);
 const [query,setQuery]=useState(""),[open,setOpen]=useState(false),[position,setPosition]=useState<CSSProperties>({});
 const term=query.trim().toLocaleLowerCase();
 const filtered=AI_MODELS.filter(model=>[model.name,...model.aliases].some(name=>name.toLocaleLowerCase().includes(term)));
 useEffect(()=>{
  if(!open)return;
  function close(event:Event){if(event.target instanceof Node&&panel.current?.contains(event.target))return;panel.current?.hidePopover();}
  window.addEventListener("resize",close);document.addEventListener("scroll",close,true);
  return()=>{window.removeEventListener("resize",close);document.removeEventListener("scroll",close,true);};
 },[open]);
 function prepare(){
  const rect=trigger.current?.getBoundingClientRect();if(!rect)return;
  const width=Math.min(Math.max(rect.width,320),window.innerWidth-24),below=window.innerHeight-rect.bottom-12;
  const down=below>=240||below>rect.top-12;
  const maxHeight=Math.min(420,down?below:rect.top-12);
  setPosition({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:down?rect.bottom+6:"auto",bottom:down?"auto":window.innerHeight-rect.top+6,width,maxHeight});setQuery("");
 }
 function select(next:string){onChange(next);panel.current?.hidePopover();trigger.current?.focus();}
 return <div className="ai-model-field"><span id={`${id}-label`} className="ai-model-label">{label}</span>
  <button ref={trigger} type="button" className="ai-model-trigger" popoverTarget={id} disabled={disabled} aria-labelledby={`${id}-label`} aria-describedby={`${id}-value`} aria-haspopup="dialog" aria-expanded={open} onClick={prepare}>
   <span className="ai-model-selected">{value&&<AIModelLogo value={value}/>}<span id={`${id}-value`}>{value||"Selecionar IA"}</span></span><ChevronDown size={16}/>
  </button>
  <div id={id} ref={panel} popover="auto" role="dialog" aria-label={`Selecionar ${label.toLocaleLowerCase()}`} className="ai-model-popover" style={position}
   onToggle={event=>{const shown=event.currentTarget.matches(":popover-open");setOpen(shown);if(shown)requestAnimationFrame(()=>search.current?.focus());}}
   onKeyDown={event=>{if(event.key==="Enter"&&event.target===search.current){event.preventDefault();if(query.trim())select(filtered[0]?.name??query.trim());else panel.current?.querySelector<HTMLButtonElement>("[data-model-option]")?.focus();return;}if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key)||event.target===search.current&&["Home","End"].includes(event.key))return;event.preventDefault();const items=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("[data-model-option]")??[]);const index=items.indexOf(document.activeElement as HTMLButtonElement);const next=event.key==="Home"?0:event.key==="End"?items.length-1:index<0?(event.key==="ArrowUp"?items.length-1:0):(index+(event.key==="ArrowUp"?-1:1)+items.length)%items.length;items[next]?.focus();}}>
   <div className="ai-model-search"><Search size={16}/><input ref={search} type="search" aria-label="Buscar modelo de IA" maxLength={80} placeholder="Buscar IA ou ferramenta…" value={query} onChange={event=>setQuery(event.target.value)}/></div>
   <div className="ai-model-options">{!query.trim()&&<button type="button" data-model-option onClick={()=>select("")}><span>Não informado</span>{!value&&<Check size={16}/>}</button>}
    {filtered.map(model=><button type="button" key={model.name} data-model-option aria-pressed={value===model.name} onClick={()=>select(model.name)}><span className="ai-model-option-name"><AIModelLogo value={model.name}/>{model.name}</span>{value===model.name&&<Check size={16}/>}</button>)}
    {query.trim()&&!AI_MODELS.some(model=>model.name.toLocaleLowerCase()===term)&&<button type="button" data-model-option onClick={()=>select(query.trim())}><span>Usar “{query.trim()}”</span></button>}
   </div>
   <p className="ai-model-help">Não encontrou? Digite o nome para usar outro modelo.</p>
  </div>
 </div>;
}
