"use client";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { AI_MODELS } from "@/lib/ai-models";
import AIModelLogo from "./AIModelLogo";

export default function AIModelPicker({value,onChange,disabled=false,label="Modelo / ferramenta"}:{value:string;onChange:(value:string)=>void;disabled?:boolean;label?:string}) {
  const models: SelectOption[] = AI_MODELS.map(model => ({value:model.name,label:model.name,searchText:[model.name,...model.aliases].join(" "),icon:<AIModelLogo value={model.name}/>}));
  if (value && !models.some(model => model.value === value)) models.push({value,label:value,searchText:value,icon:<AIModelLogo value={value}/>});
  return <SelectField label={label} value={value} onValueChange={onChange} disabled={disabled} searchable allowCustomValue
    className="ai-model-field" placeholder="Selecionar IA" options={[{value:"",label:"Não informado"},...models]}/>;
}
