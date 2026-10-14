"use client";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useCatalogOptions, useSiteLayout } from "@/components/layout/SiteLayout";
import { matchesCatalog } from "@/lib/catalog";
import type { Prompt } from "@/lib/supabase/types";
import CreatorSearch from "@/components/profile/CreatorSearch";
const emptyPrompts: Prompt[] = [];
import PublicPromptCard from "./PublicPromptCard";
export default function ExploreCatalog({ prompts, loadFailed = false }: { prompts: Prompt[]; loadFailed?: boolean }) {
  const { searchValue, setSearchValue, category, model, setCategory, setModel, openNewPrompt } = useSiteLayout();
  const [view, setView] = useState("prompts");
  const people = view === "people" || searchValue.trim().startsWith("@");
  useCatalogOptions(people ? emptyPrompts : prompts);
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState("recent");
  const visible = useMemo(() => prompts.filter(prompt => matchesCatalog(prompt, searchValue, category, model, prompt.creatorName) && (kind === "all" || (kind === "images" ? prompt.images.length > 0 : prompt.images.length === 0)))
    .sort((a,b) => sort === "title" ? a.title.localeCompare(b.title,"pt-BR") : b.createdAt-a.createdAt), [prompts, searchValue, category, model, kind, sort]);
  return <main className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-7xl px-5 py-7 sm:px-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Explorar</h1><p className="mt-2 text-sm text-muted">O prompt, as referências e o resultado. Tudo em um só lugar.</p></div></div>
    <div className="mb-6 flex gap-2" aria-label="Tipo de busca">{[["prompts","Prompts"],["people","Pessoas"]].map(([value,label]) => <button key={value} type="button" aria-pressed={people === (value === "people")} className={`catalog-filter-chip ${people === (value === "people") ? "is-active" : ""}`} onClick={() => { setView(value); if (value === "prompts" && searchValue.trim().startsWith("@")) setSearchValue(""); }}>{label}</button>)}</div>
    <CreatorSearch query={searchValue} compact={!people} />
    {!people && <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2">{[["all","Tudo"],["images","Com imagens"],["text","Texto"]].map(([value,label]) => <button key={value} type="button" onClick={() => setKind(value)} aria-pressed={kind === value} className={`catalog-filter-chip ${kind === value ? "is-active" : ""}`}>{label}</button>)}</div>
      <label className="flex items-center gap-2 text-sm text-muted"><SlidersHorizontal size={16} /><span className="sr-only">Ordenar prompts</span><select value={sort} onChange={event => setSort(event.target.value)} className="max-w-40 bg-transparent py-2 outline-offset-4"><option value="recent">Mais recentes</option><option value="title">Título: A–Z</option></select></label>
    </div>
    {(category || model) && <div className="mb-5 flex flex-wrap gap-2">{category && <button type="button" onClick={() => setCategory("")} className="catalog-filter-chip inline-flex items-center gap-2" aria-label={`Remover categoria ${category}`}>{category}<X size={14} /></button>}{model && <button type="button" onClick={() => setModel("")} className="catalog-filter-chip inline-flex items-center gap-2" aria-label={`Remover modelo ${model}`}>{model}<X size={14} /></button>}</div>}
    {loadFailed ? <div className="catalog-empty"><h2>Não foi possível carregar os prompts.</h2><p>Confira sua conexão e tente novamente.</p><button type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div> : visible.length ? <div className="catalog-grid">{visible.map(prompt => <PublicPromptCard key={`${prompt.creatorId}:${prompt.id}`} prompt={prompt} />)}</div> : <div className="catalog-empty"><h2>{prompts.length ? "Nenhum prompt com esses filtros." : "As primeiras publicações estão chegando."}</h2><p>{prompts.length ? "Tente outra busca ou remova um filtro." : "Crie um prompt na sua biblioteca e escolha quando publicar."}</p>{!prompts.length && <button type="button" onClick={openNewPrompt}>Criar meu primeiro prompt</button>}</div>}
    </>}
  </main>;
}
