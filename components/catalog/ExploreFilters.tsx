"use client";
import { useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
type Option = {value:string;label:string;compact?:string};
function FilterMenu({label,value,options,onChange}: {label:string;value:string;options:Option[];onChange:(value:string)=>void}) {
  const ref=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{const close=(event:PointerEvent)=>{if(event.target instanceof Node&&!ref.current?.contains(event.target))ref.current?.removeAttribute("open");};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[]);
  const selected=options.find(option=>option.value===value);
  return <details ref={ref} className="explore-filter" onKeyDown={event=>{if(event.key==="Escape"){ref.current?.removeAttribute("open");ref.current?.querySelector("summary")?.focus();}}}>
    <summary title={selected?.label || label}><span className="hidden sm:inline">{selected?.label || label}</span><span className="sm:hidden">{selected?.compact || selected?.label || label}</span><ChevronDown size={15}/></summary>
    <div className="explore-filter-popup" role="group" aria-label={label}>{options.map(option=><button key={option.value} type="button" aria-pressed={value===option.value} onClick={()=>{onChange(option.value);ref.current?.removeAttribute("open");ref.current?.querySelector("summary")?.focus();}}><span>{option.label}</span>{value===option.value&&<Check size={15}/>}</button>)}</div>
  </details>;
}
export default function ExploreFilters({categories,models,category,model,sort,hasQuery,onCategory,onModel,onSort}:{categories:string[];models:string[];category:string;model:string;sort:string;hasQuery:boolean;onCategory:(value:string)=>void;onModel:(value:string)=>void;onSort:(value:string)=>void}){
  return <div className="explore-filters" aria-label="Filtros de exploração">
    <FilterMenu label="Ordenação" value={sort} onChange={onSort} options={[...(hasQuery?[{value:"relevance",label:"Mais relevantes",compact:"Relevantes"}]:[]),{value:"recent",label:"Mais recentes",compact:"Recentes"},{value:"title",label:"Título: A–Z",compact:"A–Z"}]}/>
    <FilterMenu label="Categoria" value={category} onChange={onCategory} options={[{value:"",label:"Categoria"},...categories.map(value=>({value,label:value}))]}/>
    <FilterMenu label="Modelo de IA" value={model} onChange={onModel} options={[{value:"",label:"Modelo de IA",compact:"Modelo"},...models.map(value=>({value,label:value}))]}/>
  </div>;
}
