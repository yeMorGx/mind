"use client";
import {useEffect,useRef,useState} from "react";
import {getVideoPlaybackUrl} from "@/lib/prompt-video";
import {Play} from "lucide-react";
export default function PromptVideo({path,url,hover=false,poster,active=false}:{path?:string;url?:string;hover?:boolean;poster?:string;active?:boolean}){
 const video=useRef<HTMLVideoElement>(null),wantPlay=useRef(false);
 const[state,setState]=useState<{path:string;url:string}|null>(null),[failedSource,setFailedSource]=useState<string|null>(null);
 useEffect(()=>{if(!path)return;let alive=true;const load=()=>{void getVideoPlaybackUrl(path).then(url=>{if(alive){setState({path,url});setFailedSource(null);}}).catch(()=>{if(alive)setFailedSource(path)})};load();const timer=setInterval(load,4*60000);return()=>{alive=false;clearInterval(timer);};},[path]);
 useEffect(()=>{if(!hover)return;const element=video.current;if(!element)return;wantPlay.current=active;if(active&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)void element.play().catch(()=>{});else{element.pause();element.currentTime=0}},[active,hover,state,url]);
 const error=failedSource===(path||url||"");
 const src=path?(state?.path===path?state.url:undefined):url;
 async function play(){wantPlay.current=true;if(!hover||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;try{await video.current?.play();}catch{/* Keep the poster if autoplay is unavailable. */}}
 return <div className={`prompt-video ${hover?"prompt-video-hover":""}`}>
 {error?<p role="status">Não foi possível carregar o vídeo.</p>:<video ref={video} src={src} poster={poster} controls={!hover} muted={hover} loop={hover} playsInline preload="metadata" onLoadedData={()=>{if(wantPlay.current)void play()}} onError={()=>setFailedSource(path||url||"")} onPointerDown={event=>{if(hover&&event.pointerType==="touch"){if(video.current?.paused)void video.current.play().catch(()=>{});else video.current?.pause();}}}/>}
 {hover&&!error&&<span className="prompt-video-label"><Play size={13}/>Vídeo</span>}
 </div>;
}
