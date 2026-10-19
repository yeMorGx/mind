"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import SponsoredCard from "@/components/campaigns/SponsoredCard";
import SponsoredHero from "@/components/campaigns/SponsoredHero";
import type {PublicCampaign} from "@/lib/campaigns/types";
import { useEffect, useMemo, useState } from "react";
import {
  useCatalogOptions,
  useSiteLayout,
} from "@/components/layout/SiteLayout";
import { matchesCatalog } from "@/lib/catalog";
import type { Prompt } from "@/lib/supabase/types";
import CreatorSearch from "@/components/profile/CreatorSearch";
import ExploreFilters from "./ExploreFilters";
import PublicPromptCard from "./PublicPromptCard";
import Masonry from "./Masonry";
import ExploreCategories from "./ExploreCategories";
import ResourceCard from "@/components/resources/ResourceCard";
import type { CatalogResource } from "@/lib/resources";
import ResourceTabs from "@/components/resources/ResourceTabs";
import "@/components/resources/resources.css";
import InteractiveButton from "@/components/ui/InteractiveButton";
import { useRouter } from "next/navigation";
import "./explore-enhancements.css";
export default function ExploreCatalog({
  prompts,
  campaign = null,
  sponsoredCard = null,
  loadFailed = false,
  searchQuery = "",
  initialCategory = "",
  resources = [],
}: {
  campaign?: PublicCampaign|null;
  sponsoredCard?: PublicCampaign|null;
  resources?: CatalogResource[];
  prompts: Prompt[];
  loadFailed?: boolean;
  searchQuery?: string;
  initialCategory?: string;
}) {
 const { t, intlLocale } = useI18n();

  const {
    setSearchValue,
    category,
    model,
    setCategory,
    setModel,
    openNewPrompt,
  } = useSiteLayout();
  const router = useRouter();
  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery, setSearchValue]);
  useEffect(() => {
    setCategory(initialCategory);
    setModel("");
  }, [initialCategory, setCategory, setModel]);
  const options = useCatalogOptions(prompts);
  const [sort, setSort] = useState("");
  const ordering =
    sort === "relevance" && !searchQuery
      ? "recent"
      : sort || (searchQuery ? "relevance" : "recent");
  const peopleOnly = searchQuery.startsWith("@");
  const visible = useMemo(
    () =>
      prompts
        .filter((prompt) => matchesCatalog(prompt, "", category, model))
        .sort((a, b) =>
          ordering === "title"
            ? a.title.localeCompare(b.title, intlLocale)
            : ordering === "recent"
              ? b.createdAt - a.createdAt
              : 0,
        ),
    [prompts, category, model, ordering, intlLocale],
  );
  return (
    <main className="catalog-page explore-page min-h-[calc(100dvh-4.5rem)]">
      {!searchQuery && !category && !model && campaign && <SponsoredHero key={campaign.id} campaign={campaign}/>}
      <ResourceTabs active="prompts" />
      <div className="explore-heading">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("Explorar")}</h1>
          {searchQuery && (
            <p className="mt-2 text-sm text-muted">
              {t("Resultados para “")}{searchQuery}”
            </p>
          )}
        </div>
        {!peopleOnly && (
          <div className="explore-heading-actions">
            {visible.length > 0 && !loadFailed && (
              <InteractiveButton
                onClick={() =>
                  router.push(
                    `/p/${visible[Math.floor(Math.random() * visible.length)].slug}`,
                  )
                }
              >
                {t("Me surpreenda")}</InteractiveButton>
            )}
            <ExploreFilters
              {...options}
              category={category}
              model={model}
              sort={ordering}
              hasQuery={Boolean(searchQuery)}
              onCategory={setCategory}
              onModel={setModel}
              onSort={setSort}
            />
          </div>
        )}
      </div>
      {searchQuery && (
        <CreatorSearch query={searchQuery} compact={!peopleOnly} />
      )}
      {!peopleOnly &&
        (loadFailed ? (
          <div className="catalog-empty">
            <h2>{t("Não foi possível carregar os prompts.")}</h2>
            <p>{t("Confira sua conexão e tente novamente.")}</p>
            <button type="button" onClick={() => window.location.reload()}>
              {t("Tentar novamente")}</button>
          </div>
        ) : visible.length ? (
          <Masonry>
            {!searchQuery && !category && !model && sponsoredCard && <SponsoredCard key={`sponsor:${sponsoredCard.id}`} campaign={sponsoredCard}/>}
            {visible.map((prompt) => (
              <PublicPromptCard
                key={`${prompt.creatorId}:${prompt.id}`}
                prompt={prompt}
              />
            ))}
          </Masonry>
        ) : (
          <div className="catalog-empty">
            <h2>
              {searchQuery || prompts.length
                ? t("Nenhum prompt com essa busca ou filtros.")
                : t("As primeiras publicações estão chegando.")}
            </h2>
            <p>
              {searchQuery || prompts.length
                ? t("Tente outra busca ou ajuste os filtros.")
                : t("Crie um prompt na sua biblioteca e escolha quando publicar.")}
            </p>
            {!searchQuery && !prompts.length && (
              <button type="button" onClick={openNewPrompt}>
                {t("Criar meu primeiro prompt")}</button>
            )}
          </div>
        ))}
      {searchQuery && resources.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-semibold">
            {t("Arquivos Markdown e MCPs")}</h2>
          <div className="catalog-grid">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      )}
      {!searchQuery && !loadFailed && (
        <ExploreCategories
          prompts={prompts}
          selected={category}
          onSelect={(value) => {
            setCategory(value);
            setModel("");
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            });
          }}
        />
      )}
    </main>
  );
}
