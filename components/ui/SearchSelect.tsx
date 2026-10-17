"use client";

import { useId, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { normalizeCatalogSearch } from "@/lib/catalog";
import AIModelLogo from "@/components/models/AIModelLogo";

export type SelectOption = { value: string; label: string; icon?: React.ReactNode };
export default function SearchSelect({ label, value, options, onChange, model = false, searchable = true }: {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; model?: boolean; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId(), input = useRef<HTMLInputElement>(null);
  const filtered = options.filter(option => normalizeCatalogSearch(option.label).includes(normalizeCatalogSearch(query)));
  const selected = options.find(option => option.value === value);
  function select(next: string) { onChange(next); setOpen(false); }
  function move(index: number) { setActive(index); document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: "nearest" }); }
  return <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (next) { setQuery(""); setActive(Math.max(0, options.findIndex(option => option.value === value))); } }}>
    <Popover.Trigger className="search-select-trigger" aria-label={`${label}: ${selected?.label || value || label}`}><span>{model && value && <AIModelLogo value={value}/>}{selected?.icon}<span>{selected?.label || value || label}</span></span><ChevronDown size={15}/></Popover.Trigger>
    <Popover.Portal><Popover.Content className="search-select-panel" sideOffset={8} align="end" collisionPadding={16} onOpenAutoFocus={event => { event.preventDefault(); input.current?.focus(); }}>
      <div className={`search-select-input ${searchable ? "" : "sort-input"}`}><Search size={16} aria-hidden="true"/><input ref={input} value={query} placeholder={searchable ? `Buscar ${model ? "modelo" : "categoria"}…` : "Buscar ordenação…"} aria-label={`Buscar em ${label}`} role="combobox" aria-expanded={open} aria-controls={listId} aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined} aria-autocomplete="list" onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); if (filtered.length) move((active + (event.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length); }
        if (event.key === "Enter" && filtered[active]) { event.preventDefault(); select(filtered[active].value); }
      }}/></div>
      <div id={listId} role="listbox" aria-label={label} className="search-select-options">{filtered.length ? filtered.map((option, index) => <div key={option.value} id={`${listId}-${index}`} role="option" aria-selected={value === option.value} data-active={active === index || undefined} onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => select(option.value)}>
        <span>{model && option.value && <AIModelLogo value={option.value}/>}{option.icon}<span>{option.label}</span></span>{option.value === value && <Check size={16}/>}</div>) : <p role="status">Nenhuma opção encontrada.</p>}</div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
