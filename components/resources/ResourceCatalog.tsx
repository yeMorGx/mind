"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import SearchSelect from "@/components/ui/SearchSelect";
import type { CatalogResource, ResourceKind } from "@/lib/resources";
import ResourceCard from "./ResourceCard";
import ResourceTabs from "./ResourceTabs";
import "../catalog/explore-enhancements.css";
import "./resources.css";
export default function ResourceCatalog({
  kind,
  resources,
  query = "",
  failed = false,
}: {
  kind: ResourceKind;
  resources: CatalogResource[];
  query?: string;
  failed?: boolean;
}) {
  const { setSearchValue } = useSiteLayout();
  const [category, setCategory] = useState(""),
    [client, setClient] = useState(""),
    [sort, setSort] = useState("recent");
  useEffect(() => {
    setSearchValue(query);
  }, [query, setSearchValue]);
  const categories = [
    ...new Set(resources.map((item) => item.document.category).filter(Boolean)),
  ];
  const clients = [
    ...new Set(resources.flatMap((item) => item.document.clients)),
  ];
  const visible = useMemo(
    () =>
      resources
        .filter(
          (item) =>
            (!category || item.document.category === category) &&
            (!client || item.document.clients.includes(client)),
        )
        .sort((a, b) =>
          sort === "title"
            ? a.document.title.localeCompare(b.document.title, "pt-BR")
            : b.created_at.localeCompare(a.created_at),
        ),
    [resources, category, client, sort],
  );
  return (
    <main className="catalog-page resource-catalog">
      <ResourceTabs active={kind} />
      <div className="explore-heading">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {kind === "markdown" ? "Arquivos Markdown" : "Diretório de MCPs"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {query
              ? `Resultados para “${query}”`
              : kind === "markdown"
                ? "Instruções, skills e sistemas de design para levar ao seu próximo projeto."
                : "Descubra servidores que conectam suas ferramentas de IA a novos recursos."}
          </p>
        </div>
        <Link
          href={`/home/resources/new?kind=${kind}`}
          className="workflow-button"
        >
          <Plus size={16} />
          {kind === "markdown" ? "Novo arquivo" : "Divulgar MCP"}
        </Link>
      </div>
      {!failed && (
        <div className="resource-filter-row">
          <span className="text-sm text-muted">
            {visible.length}{" "}
            {visible.length === 1 ? "publicação" : "publicações"}
          </span>
          <div>
            <SearchSelect
              label="Categoria"
              value={category}
              onChange={setCategory}
              options={[
                { value: "", label: "Todas as categorias" },
                ...categories.map((value) => ({ value, label: value })),
              ]}
            />
            <SearchSelect
              label="Compatibilidade"
              value={client}
              onChange={setClient}
              options={[
                { value: "", label: "Todas as ferramentas" },
                ...clients.map((value) => ({ value, label: value })),
              ]}
            />
            <SearchSelect
              label="Ordenar"
              value={sort}
              onChange={setSort}
              options={[
                { value: "recent", label: "Mais recentes" },
                { value: "title", label: "Título A–Z" },
              ]}
            />
          </div>
        </div>
      )}
      {failed ? (
        <div className="catalog-empty">
          <h2>Esta área está sendo preparada.</h2>
          <p>O catálogo ainda não está disponível. Tente novamente em breve.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      ) : visible.length ? (
        <div className="catalog-grid">
          {visible.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <h2>
            {query || category || client
              ? "Nenhuma publicação com esses filtros."
              : kind === "markdown"
                ? "Seu próximo projeto pode começar aqui."
                : "As primeiras conexões vêm aí."}
          </h2>
          <p>
            {query || category || client
              ? "Tente outra busca ou ajuste os filtros."
              : kind === "markdown"
                ? "Compartilhe seu DESIGN.md, SKILL.md ou CLAUDE.md com a comunidade."
                : "Conhece um MCP útil? Divulgue os links oficiais e como usar."}
          </p>
          <Link
            href={`/home/resources/new?kind=${kind}`}
            className="workflow-button"
          >
            {kind === "markdown"
              ? "Compartilhar um arquivo"
              : "Divulgar um MCP"}
          </Link>
        </div>
      )}
    </main>
  );
}
