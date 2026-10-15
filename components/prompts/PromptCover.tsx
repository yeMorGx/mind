"use client";
import {useEffect,useRef,useState} from "react";
import {Sparkles} from "lucide-react";
import PromptVideo from "./PromptVideo";
import type {PromptShowcase} from "@/lib/prompt-showcase";
type Props={prompt:PromptShowcase&{title:string;description:string;images:{id:string;url:string;label:string;role:string}[]}};
export default function PromptCover({prompt}:Props){
 const root=useRef<HTMLDivElement>(null);
 const[hover,setHover]=useState(false),[index,setIndex]=useState(0),[failed,setFailed]=useState<string[]>([]);
 const results=prompt.images.filter(image=>image.role==="gallery"||image.role==="after");
 const images=results.length?results:prompt.images.slice(0,1);
 useEffect(()=>{if(!hover||images.length<2||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const timer=setInterval(()=>setIndex(value=>(value+1)%images.length),1500);return()=>clearInterval(timer);},[hover,images.length]);
 useEffect(()=>{const element=root.current?.closest("article,.catalog-library-card")??root.current;if(!element)return;const enter=()=>setHover(true),leave=()=>{setHover(false);setIndex(0)},blur=(event:Event)=>{if(!element.contains((event as FocusEvent).relatedTarget as Node|null))leave()};element.addEventListener("mouseenter",enter);element.addEventListener("mouseleave",leave);element.addEventListener("focusin",enter);element.addEventListener("focusout",blur);return()=>{element.removeEventListener("mouseenter",enter);element.removeEventListener("mouseleave",leave);element.removeEventListener("focusin",enter);element.removeEventListener("focusout",blur)}},[]);
 const cover=images[index%Math.max(images.length,1)];
 return <div ref={root} className="prompt-cover-media">
 {prompt.kind==="video"&&(prompt.videoPath||prompt.videoUrl)?<PromptVideo path={prompt.videoPath} url={prompt.videoUrl} poster={cover?.url} hover active={hover}/>:cover&&!failed.includes(cover.url)?
 // eslint-disable-next-line @next/next/no-img-element -- Existing optimized prompt uploads.
 <img src={cover.url} alt={cover.label||prompt.title} loading="lazy" draggable={false} onError={()=>setFailed(value=>[...value,cover.url])}/>:<div className="catalog-text-preview"><Sparkles size={24}/><p>{prompt.summary||prompt.description||"Conheça este prompt"}</p></div>}
 {prompt.kind==="website"&&<span className="prompt-kind-label">Site</span>}
 {images.length>1&&prompt.kind!=="video"&&<span className="prompt-cover-position" aria-hidden="true">{index%images.length+1}/{images.length}</span>}
 </div>;
}
