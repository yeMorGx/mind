"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { SlidersHorizontal, X } from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";

type Values = { category: string; model: string; sort: string };
type Props = Values & { categories: string[]; models: string[]; hasQuery: boolean; onCategory: (value: string) => void; onModel: (value: string) => void; onSort: (value: string) => void };
export default function ExploreFilters({ categories, models, category, model, sort, hasQuery, onCategory, onModel, onSort }: Props) {
 const { t } = useI18n();

  const [open, setOpen] = useState(false), [draft, setDraft] = useState<Values>({ category, model, sort });
  const count = Number(Boolean(category)) + Number(Boolean(model));
  const orders = [...(hasQuery ? [{ value: "relevance", label: t("Mais relevantes") }] : []), { value: "recent", label: t("Mais recentes") }, { value: "title", label: t("Título: A–Z") }];
  const categoryOptions = [{ value: "", label: t("Todas as categorias") }, ...categories.map(value => ({ value, label: value }))];
  const modelOptions = [{ value: "", label: t("Todos os modelos") }, ...models.map(value => ({ value, label: value }))];
  function fields(values: Values, change: (key: keyof Values, value: string) => void, mobile = false) {
    return <><div>{mobile && <span className="filter-field-label">{t("Ordenação")}</span>}<SearchSelect label={t("Ordenação")} value={values.sort} options={orders} onChange={value => change("sort", value)} searchable={false}/></div>
      <div>{mobile && <span className="filter-field-label">{t("Categoria")}</span>}<SearchSelect label={t("Categoria")} value={values.category} options={categoryOptions} onChange={value => change("category", value)}/></div>
      <div>{mobile && <span className="filter-field-label">{t("Modelo de IA")}</span>}<SearchSelect label={t("Modelo de IA")} value={values.model} options={modelOptions} onChange={value => change("model", value)} model/></div></>;
  }
  function apply(values: Values) { onCategory(values.category); onModel(values.model); onSort(values.sort); }
  return <div className="explore-filter-controls">
    <div className="explore-desktop-filters" aria-label={t("Filtros de exploração")}>{fields({ category, model, sort }, (key, value) => ({ category: onCategory, model: onModel, sort: onSort })[key](value))}{count > 0 && <button className="explore-clear-filters" type="button" onClick={() => { onCategory(""); onModel(""); }}>{t("Limpar")}</button>}</div>
    <Dialog.Root open={open} onOpenChange={next => { if (next) setDraft({ category, model, sort }); setOpen(next); }}>
      <Dialog.Trigger className="explore-mobile-filters"><SlidersHorizontal size={17}/>{t("Filtros")}{count > 0 && <span>{count}</span>}</Dialog.Trigger>
      <Dialog.Portal><Dialog.Overlay className="filters-drawer-overlay"/><Dialog.Content className="filters-drawer">
        <div className="filters-drawer-handle" aria-hidden="true"/>
        <div className="filters-drawer-heading"><Dialog.Title>{t("Encontrar prompts")}</Dialog.Title><Dialog.Close aria-label={t("Fechar filtros")}><X size={20}/></Dialog.Close></div>
        <Dialog.Description>{t("Escolha uma categoria ou modelo de IA para explorar.")}</Dialog.Description>
        <div className="filters-drawer-fields">{fields(draft, (key, value) => setDraft(previous => ({ ...previous, [key]: value })), true)}</div>
        <div className="filters-drawer-actions"><button type="button" onClick={() => setDraft({ category: "", model: "", sort: hasQuery ? "relevance" : "recent" })}>{t("Limpar filtros")}</button><button type="button" onClick={() => { apply(draft); setOpen(false); }}>{t("Aplicar filtros")}</button></div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}
