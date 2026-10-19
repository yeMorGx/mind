"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { SelectField } from "@/components/ui/SelectField";
export default function CatalogFilters({ categories,models }: {categories:string[];models:string[]}) {
 const { t } = useI18n();

  const {category,model,setCategory,setModel} = useSiteLayout();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (event.target instanceof Element && event.target.closest(".mind-select-popover")) return; if (event.target instanceof Node && !menu.current?.contains(event.target)) menu.current?.removeAttribute("open"); };
    document.addEventListener("pointerdown",close);
    return () => document.removeEventListener("pointerdown",close);
  },[]);
  if (!categories.length && !models.length) return null;
  const count = Number(Boolean(category)) + Number(Boolean(model));
  return <details ref={menu} className="catalog-filter-menu" onKeyDown={event => { if (event.key === "Escape") { menu.current?.removeAttribute("open"); menu.current?.querySelector("summary")?.focus(); } }}>
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm [&::-webkit-details-marker]:hidden"><SlidersHorizontal size={15} />{t("Filtros")}{count > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{count}</span>}</summary>
    <div className="catalog-filter-options">
      {categories.length > 0 && <SelectField label={t("Categoria")} value={category} onValueChange={setCategory} placeholder={t("Todas as categorias")} options={[{value:"",label:t("Todas as categorias")},...categories.map(value=>({value,label:value}))]} />}
      {models.length > 0 && <SelectField label={t("Modelo")} value={model} onValueChange={setModel} placeholder={t("Todos os modelos")} options={[{value:"",label:t("Todos os modelos")},...models.map(value=>({value,label:value}))]} />}
      <div className="flex items-center justify-between gap-3"><button type="button" onClick={() => {setCategory("");setModel("");}} className="min-h-11 px-1 text-sm text-muted underline underline-offset-4">{t("Limpar filtros")}</button><button type="button" onClick={() => menu.current?.removeAttribute("open")} className="min-h-11 rounded-full bg-primary px-5 text-sm text-primary-foreground">{t("Aplicar")}</button></div>
    </div>
  </details>;
}
