"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {useEffect,useRef,useState,type MouseEvent} from "react";
import {ArrowUpRight,ChevronDown} from "lucide-react";
import AIModelLogo from "@/components/models/AIModelLogo";
const providers=[{name:"ChatGPT",base:"https://chatgpt.com/",prefill:"https://chatgpt.com/?q="},{name:"Claude",base:"https://claude.ai/new",prefill:"https://claude.ai/new?q="},{name:"Gemini",base:"https://gemini.google.com/app",prefill:""}];
export default function PromptUseAI({content,hasImages=false}:{content:string;hasImages?:boolean}){
 const { t } = useI18n();

 const menu=useRef<HTMLDetailsElement>(null);
 const [message,setMessage]=useState("");
 useEffect(()=>{function outside(event:PointerEvent){if(event.target instanceof Node&&!menu.current?.contains(event.target))menu.current?.removeAttribute("open");}document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside);},[]);
 async function copyAndOpen(event:MouseEvent<HTMLAnchorElement>,url:string){
  event.preventDefault();menu.current?.removeAttribute("open");setMessage("");
  const next=window.open("about:blank","_blank");if(next)next.opener=null;
  try{await navigator.clipboard.writeText(content);if(next)next.location.replace(url);else window.location.assign(url);setMessage(t("Texto copiado. Cole no campo da IA para começar."));}
  catch{next?.close();setMessage(t("Não foi possível copiar automaticamente. Use “Copiar prompt” antes de abrir a IA."));}
 }
 return <div className="prompt-use-ai"><details ref={menu} onKeyDown={event=>{if(event.key==="Escape"){menu.current?.removeAttribute("open");menu.current?.querySelector("summary")?.focus();}}}>
  <summary className="workflow-button" aria-label={t("Usar com IA")}>{t("Usar com IA")}{" "}<ChevronDown size={16}/></summary>
  <div className="prompt-use-ai-menu"><h3>{t("Escolha onde usar")}</h3>{providers.map(provider=>{const direct=provider.prefill?provider.prefill+encodeURIComponent(content):"";const prefilled=Boolean(direct&&direct.length<=24000&&(provider.name!=="Claude"||content.length<=14000));return <a key={provider.name} href={prefilled?direct:provider.base} target="_blank" rel="noopener noreferrer" onClick={event=>{if(prefilled){menu.current?.removeAttribute("open");setMessage("");}else void copyAndOpen(event,provider.base);}}><AIModelLogo value={provider.name}/><span><strong>{provider.name}</strong><small>{prefilled?t("Abrir com o texto"):t("Copiar e abrir")}</small></span><ArrowUpRight size={16}/></a>;})}<p>{t("No Gemini, cole o texto copiado.")}{hasImages?t(" As imagens precisam ser anexadas na IA."):""}</p></div>
 </details>{message&&<p role="status" className="prompt-use-ai-feedback">{t(message)}</p>}</div>;
}
