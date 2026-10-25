"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {useEffect,useRef,useState} from "react";
import {Sparkles} from "lucide-react";
import PromptVideo from "./PromptVideo";
import type {PromptShowcase} from "@/lib/prompt-showcase";
import {useReducedMotion} from "framer-motion";
import PixelImage from "@/components/ui/PixelImage";
import { ImageCompare } from "@/components/ui/ImageCompare";
type Props={prompt:PromptShowcase&{title:string;description:string;images:{id:string;url:string;label:string;role:string}[]};pixelTransition?:boolean;onImageSize?:(width:number,height:number)=>void};
export default function PromptCover({prompt,pixelTransition=false,onImageSize}:Props){
 const { t } = useI18n();

 const root=useRef<HTMLDivElement>(null);
 const reducedMotion=useReducedMotion();
 const[hover,setHover]=useState(false),[index,setIndex]=useState(0),[failed,setFailed]=useState<string[]>([]);
 const before=prompt.images.find(image=>image.role==="before"),after=prompt.images.find(image=>image.role==="after");
 const comparisonSelected=prompt.coverMode==="compare"&&Boolean(before&&after);
 const comparison=prompt.coverMode==="compare"&&before&&after&&!failed.includes(before.url)&&!failed.includes(after.url)?{before,after}:null;
 const results=prompt.images.filter(image=>image.role==="gallery"||image.role==="after");
 const selected=prompt.coverMode==="image"?prompt.images.find(image=>image.id===prompt.coverImageId&&image.role!=="reference"):undefined;
 const sourceImages=selected?[selected]:results.length?results:prompt.images.filter(image=>image.role!=="reference").slice(0,1);
 const images=sourceImages.filter(image=>!failed.includes(image.url));
 useEffect(()=>{if(!hover||comparisonSelected||images.length<2||reducedMotion)return;const timer=setInterval(()=>{if(!document.hidden)setIndex(value=>(value+1)%images.length);},pixelTransition?2400:1500);return()=>clearInterval(timer);},[hover,comparisonSelected,images.length,pixelTransition,reducedMotion]);
 useEffect(()=>{const element=root.current?.closest("article,.catalog-library-card")??root.current;if(!element)return;const enter=()=>setHover(true),leave=()=>{setHover(false);setIndex(0)},blur=(event:Event)=>{if(!element.contains((event as FocusEvent).relatedTarget as Node|null))leave()};element.addEventListener("mouseenter",enter);element.addEventListener("mouseleave",leave);element.addEventListener("focusin",enter);element.addEventListener("focusout",blur);return()=>{element.removeEventListener("mouseenter",enter);element.removeEventListener("mouseleave",leave);element.removeEventListener("focusin",enter);element.removeEventListener("focusout",blur)}},[]);
 const cover=images[index%Math.max(images.length,1)];
 return <div ref={root} className="prompt-cover-media">
 {comparison&&<ImageCompare beforeSrc={comparison.before.url} afterSrc={comparison.after.url} beforeAlt={comparison.before.label||"Antes"} afterAlt={comparison.after.label||"Depois"} onImageSize={onImageSize} onImageError={source=>{const url=source==="before"?comparison.before.url:comparison.after.url;setFailed(value=>value.includes(url)?value:[...value,url]);}} interactive={false}/>}
 {!comparison&&<>
 {prompt.kind==="video"&&(prompt.videoPath||prompt.videoUrl)?<PromptVideo path={prompt.videoPath} url={prompt.videoUrl} poster={cover?.url} hover active={hover}/>:cover&&pixelTransition?<PixelImage src={cover.url} alt={cover.label||prompt.title} onError={()=>setFailed(value=>[...value,cover.url])} onSize={onImageSize}/>:cover?
 // eslint-disable-next-line @next/next/no-img-element -- Existing optimized prompt uploads.
 <img src={cover.url} alt={cover.label||prompt.title} loading="lazy" draggable={false} onError={()=>setFailed(value=>[...value,cover.url])}/>:<div className="catalog-text-preview"><Sparkles size={24}/><p>{prompt.summary||prompt.description||t("Conheça este prompt")}</p></div>}
 {images.length>1&&prompt.kind!=="video"&&<span className="prompt-cover-position" aria-hidden="true">{index%images.length+1}/{images.length}</span>}
 </>}
 {prompt.kind==="website"&&<span className="prompt-kind-label">{t("Site")}</span>}
 </div>;
}
