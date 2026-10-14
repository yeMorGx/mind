"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useCatalogOptions, useSiteLayout } from "@/components/layout/SiteLayout";
import { matchesCatalog } from "@/lib/catalog";
import type { Prompt } from "@/lib/supabase/types";
import CreatorSearch from "@/components/profile/CreatorSearch";
const emptyPrompts: Prompt[] = [];
import CatalogFilters from "./CatalogFilters";
import PublicPromptCard from "./PublicPromptCard";
export default function ExploreCatalog({ prompts, loadFailed = false, searchQuery = "" }: { prompts: Prompt[]; loadFailed?: boolean; searchQuery?: string }) {
  const { searchValue, setSearchValue, category, model, setCategory, setModel, openNewPrompt } = useSiteLayout();
  const router = useRouter();
  useEffect(() => { setSearchValue(searchQuery); },[searchQuery,setSearchValue]);
  const [view, setView] = useState("prompts");
  const people = view === "people" || searchValue.trim().startsWith("@");
  const options = useCatalogOptions(people ? emptyPrompts : prompts);
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState("");
  const ordering = sort === "relevance" && !searchQuery ? "recent" : sort || (searchQuery ? "relevance" : "recent");
  const visible = useMemo(() => prompts.filter(prompt => matchesCatalog(prompt, searchQuery && searchValue === searchQuery ? "" : searchValue, category, model, prompt.creatorName) && (kind === "all" || (kind === "images" ? prompt.images.length > 0 : prompt.images.length === 0)))
    .sort((a,b) => ordering === "title" ? a.title.localeCompare(b.title,"pt-BR") : ordering === "relevance" ? 0 : b.createdAt-a.createdAt), [prompts, searchValue, category, model, kind, ordering, searchQuery]);
  return <main className="catalog-page mx-auto min-h-[calc(100dvh-4.5rem)] max-w-[1600px] px-5 py-7 sm:px-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Explorar</h1><p className="mt-2 text-sm text-muted">{searchQuery ? `Resultados para “${searchQuery}”` : "O prompt, as referências e o resultado. Tudo em um só lugar."}</p></div></div>
    <div className="catalog-view-row mb-5 flex items-center justify-between gap-3"><div className="flex gap-2" aria-label="Tipo de busca">{[["prompts","Prompts"],["people","Pessoas"]].map(([value,label]) => <button key={value} type="button" aria-pressed={people === (value === "people")} className={`catalog-filter-chip ${people === (value === "people") ? "is-active" : ""}`} onClick={() => { setView(value); if (value === "prompts" && searchValue.trim().startsWith("@")) { setSearchValue(""); router.push("/explore"); } }}>{label}</button>)}</div>{!people && <CatalogFilters {...options} />}</div>
    <CreatorSearch query={searchValue} compact={!people} />
    {!people && <>
    <div className="catalog-kind-row mb-6 flex items-center justify-between gap-3">
      <div className="catalog-kind-chips flex gap-2">{[["all","Tudo"],["images","Com imagens"],["text","Texto"]].map(([value,label]) => <button key={value} type="button" onClick={() => setKind(value)} aria-pressed={kind === value} className={`catalog-filter-chip ${kind === value ? "is-active" : ""}`}>{label}</button>)}</div>
      <label className="catalog-sort flex items-center gap-2 text-sm text-muted"><SlidersHorizontal size={16} /><span className="sr-only">Ordenar prompts</span><select value={ordering} onChange={event => setSort(event.target.value)} className="max-w-40 bg-transparent py-2 outline-offset-4">{searchQuery && <option value="relevance">Mais relevantes</option>}<option value="recent">Mais recentes</option><option value="title">Título: A–Z</option></select></label>
    </div>
    {(category || model) && <div className="mb-5 flex flex-wrap gap-2">{category && <button type="button" onClick={() => setCategory("")} className="catalog-filter-chip inline-flex items-center gap-2" aria-label={`Remover categoria ${category}`}>{category}<X size={14} /></button>}{model && <button type="button" onClick={() => setModel("")} className="catalog-filter-chip inline-flex items-center gap-2" aria-label={`Remover modelo ${model}`}>{model}<X size={14} /></button>}</div>}
    {loadFailed ? <div className="catalog-empty"><h2>Não foi possível carregar os prompts.</h2><p>Confira sua conexão e tente novamente.</p><button type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div> : visible.length ? <div className="catalog-grid">{visible.map(prompt => <PublicPromptCard key={`${prompt.creatorId}:${prompt.id}`} prompt={prompt} />)}</div> : <div className="catalog-empty"><h2>{searchQuery || prompts.length ? "Nenhum prompt com essa busca ou filtros." : "As primeiras publicações estão chegando."}</h2><p>{searchQuery || prompts.length ? "Tente outra busca ou remova um filtro." : "Crie um prompt na sua biblioteca e escolha quando publicar."}</p>{!searchQuery && !prompts.length && <button type="button" onClick={openNewPrompt}>Criar meu primeiro prompt</button>}</div>}
    </>}
  </main>;
}
