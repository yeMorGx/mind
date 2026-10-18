"use client";
import { SelectField, type SelectOption } from "./SelectField";
import AIModelLogo from "@/components/models/AIModelLogo";
export type { SelectOption } from "./SelectField";

export default function SearchSelect({ label, value, options, onChange, model = false, searchable = true }: {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; model?: boolean; searchable?: boolean;
}) {
  return <SelectField label={label} value={value} onValueChange={onChange} hideLabel searchable={searchable}
    className="mind-select-filter" triggerClassName="search-select-trigger"
    placeholder={options.find(option => !option.value)?.label || label}
    options={options.map(option => ({...option, icon: model && option.value ? <AIModelLogo value={option.value}/> : option.icon}))}/>;
}
