"use client";
import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from "react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { readSocial,saveSocial,socialKey,type SocialTarget,type SocialState } from "@/lib/social";
type Context={data:Record<string,SocialState>;failed:boolean;register:(target:SocialTarget)=>()=>void;retry:()=>void;change:(target:SocialTarget,kind:"follow"|"like",active:boolean)=>Promise<void>};
const SocialContext=createContext<Context|null>(null);
export default function SocialProvider({children}:{children:ReactNode}){
  const {user}=useOnboarding();const viewer=user?.uid??null;
  const currentViewer=useRef(viewer);useEffect(()=>{currentViewer.current=viewer;},[viewer]);
  const references=useRef(new Map<string,{target:SocialTarget;count:number}>());
  const generation=useRef(0);
  const [version,setVersion]=useState(0);
  const [snapshot,setSnapshot]=useState<{viewer:string|null;data:Record<string,SocialState>;failed:boolean}|null>(null);
  const register=useCallback((target:SocialTarget)=>{const key=socialKey(target);const old=references.current.get(key);references.current.set(key,{target,count:(old?.count??0)+1});if(!old)setVersion(value=>value+1);return()=>{const stored=references.current.get(key);if(!stored)return;if(stored.count===1){references.current.delete(key);setVersion(value=>value+1);}else stored.count--;};},[]);
  const retry=useCallback(()=>setVersion(value=>value+1),[]);
  useEffect(()=>{
    const targets=[...references.current.values()].map(item=>item.target);if(!targets.length)return;
    const request=++generation.current;
    const controller=new AbortController();const timer=window.setTimeout(()=>{void readSocial(targets,viewer,AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])).then(data=>{if(!controller.signal.aborted&&request===generation.current)setSnapshot({viewer,data,failed:false});}).catch(()=>{if(!controller.signal.aborted&&request===generation.current)setSnapshot(old=>({viewer,data:old?.viewer===viewer?old.data:{},failed:true}));});},80);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[version,viewer]);
  async function change(target:SocialTarget,kind:"follow"|"like",active:boolean){
    if(!user)throw new Error("Entre para continuar.");
    const identity=user.uid;generation.current++;await saveSocial(user,target,kind,active);const data=await readSocial([target],identity);
    if(currentViewer.current!==identity)return;
    setSnapshot(old=>({viewer:identity,data:{...(old?.viewer===identity?old.data:{}),...data},failed:false}));retry();
  }
  return <SocialContext.Provider value={{data:snapshot?.viewer===viewer?snapshot.data:{},failed:Boolean(snapshot&&snapshot.viewer===viewer&&snapshot.failed),register,retry,change}}>{children}</SocialContext.Provider>;
}
export function useSocial(target:SocialTarget){
  const context=useContext(SocialContext);if(!context)throw new Error("SocialProvider não encontrado.");
  const {register}=context;const {creatorId,promptId}=target;
  useEffect(()=>register({creatorId,promptId}),[creatorId,promptId,register]);
  return {...context,state:context.data[socialKey(target)]};
}
