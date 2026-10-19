"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import SponsoredCard from "@/components/campaigns/SponsoredCard";
import type {PublicCampaign} from "@/lib/campaigns/types";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import SearchSelect from "@/components/ui/SearchSelect";
import type { CatalogResource, ResourceKind } from "@/lib/resources";
import { ResourceClientIdentity } from "./ResourceClients";
import ResourceCard from "./ResourceCard";
import ResourceTabs from "./ResourceTabs";
import "../catalog/explore-enhancements.css";
import "./resources.css";
export default function ResourceCatalog({
  kind,
  campaign = null,
  resources,
  query = "",
  failed = false,
}: {
  kind: ResourceKind;
  campaign?: PublicCampaign|null;
  resources: CatalogResource[];
  query?: string;
  failed?: boolean;
}) {
 const { t, intlLocale } = useI18n();

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
            ? a.document.title.localeCompare(b.document.title, intlLocale)
            : b.created_at.localeCompare(a.created_at),
        ),
    [resources, category, client, sort, intlLocale],
  );
  return (
    <main className="catalog-page resource-catalog">
      <ResourceTabs active={kind} />
      <div className="explore-heading">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {kind === "markdown" ? t("Arquivos Markdown") : t("Diretório de MCPs")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {query
              ? t("Resultados para “{v0}”", {v0: (query)})
              : kind === "markdown"
                ? t("Instruções, skills e sistemas de design para levar ao seu próximo projeto.")
                : t("Descubra servidores que conectam suas ferramentas de IA a novos recursos.")}
          </p>
        </div>
        <Link
          href={`/home/resources/new?kind=${kind}`}
          className="workflow-button"
        >
          <Plus size={16} />
          {kind === "markdown" ? t("Novo arquivo") : t("Divulgar MCP")}
        </Link>
      </div>
      {!failed && (
        <div className="resource-filter-row">
          <span className="text-sm text-muted">
            {visible.length}{" "}
            {visible.length === 1 ? t("publicação") : t("publicações")}
          </span>
          <div>
            <SearchSelect
              label={t("Categoria")}
              value={category}
              onChange={setCategory}
              options={[
                { value: "", label: t("Todas as categorias") },
                ...categories.map((value) => ({ value, label: value })),
              ]}
            />
            <SearchSelect
              label={t("Compatibilidade")}
              value={client}
              onChange={setClient}
              options={[
                { value: "", label: t("Todas as ferramentas") },
                ...clients.map((value) => ({ value, label: value, icon: <ResourceClientIdentity value={value} iconOnly/> })),
              ]}
            />
            <SearchSelect
              label={t("Ordenar")}
              value={sort}
              onChange={setSort}
              options={[
                { value: "recent", label: t("Mais recentes") },
                { value: "title", label: t("Título A–Z") },
              ]}
            />
          </div>
        </div>
      )}
      {failed ? (
        <div className="catalog-empty">
          <h2>{t("Esta área está sendo preparada.")}</h2>
          <p>{t("O catálogo ainda não está disponível. Tente novamente em breve.")}</p>
          <button type="button" onClick={() => window.location.reload()}>
            {t("Tentar novamente")}</button>
        </div>
      ) : visible.length ? (
        <div className="catalog-grid">
          {!query && !category && !client && campaign && <SponsoredCard key={`sponsor:${campaign.id}`} campaign={campaign}/>}
          {visible.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <h2>
            {query || category || client
              ? t("Nenhuma publicação com esses filtros.")
              : kind === "markdown"
                ? t("Seu próximo projeto pode começar aqui.")
                : t("As primeiras conexões vêm aí.")}
          </h2>
          <p>
            {query || category || client
              ? t("Tente outra busca ou ajuste os filtros.")
              : kind === "markdown"
                ? t("Compartilhe seu DESIGN.md, SKILL.md ou CLAUDE.md com a comunidade.")
                : t("Conhece um MCP útil? Divulgue os links oficiais e como usar.")}
          </p>
          <Link
            href={`/home/resources/new?kind=${kind}`}
            className="workflow-button"
          >
            {kind === "markdown"
              ? t("Compartilhar um arquivo")
              : t("Divulgar um MCP")}
          </Link>
        </div>
      )}
    </main>
  );
}
