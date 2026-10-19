"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {Bot} from "lucide-react";
import {findAIModel} from "@/lib/ai-models";
export default function AIModelLogo({value}:{value:string}){
 const { t } = useI18n();

 if(!value.trim())return null;
 const model=findAIModel(value);
 return <span className="ai-model-logo" role="img" aria-label={t("IA utilizada: {v0}", {v0: (value)})} title={value}>
  {model?
   // eslint-disable-next-line @next/next/no-img-element -- Locally hosted, licensed brand SVGs.
   <img src={`/ai-models/${model.icon}.svg`} alt="" width={22} height={22}/>:<Bot size={22}/>}
 </span>;
}
