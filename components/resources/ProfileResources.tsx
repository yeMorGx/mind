"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useState } from "react";
import { requireSupabaseClient } from "@/lib/supabase/client";
import type { CreatorProfile } from "@/lib/firebase/publication";
import type { CatalogResource, ResourceKind } from "@/lib/resources";
import ResourceCard from "./ResourceCard";
import Link from "next/link";
export default function ProfileResources({
  creatorId,
  profile,
  kind,
  owner,
}: {
  creatorId: string;
  profile: CreatorProfile;
  kind: ResourceKind;
  owner: boolean;
}) {
 const { t } = useI18n();

  const [result, setResult] = useState<{
      items: CatalogResource[];
      failed: boolean;
    } | null>(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void requireSupabaseClient()
      .from("mind_resources")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("kind", kind)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal)
      .then(({ data, error }) => {
        if (controller.signal.aborted) return;
        setResult({
          items: (data ?? []).map((item) => ({
            ...item,
            creator: profile,
          })) as CatalogResource[],
          failed: Boolean(error),
        });
      });
    return () => controller.abort();
  }, [creatorId, kind, profile, attempt]);
  if (!result)
    return (
      <p role="status" className="py-16 text-center text-muted">
        {t("Carregando publicações…")}</p>
    );
  if (result.failed)
    return (
      <div className="catalog-empty">
        <h3>{t("Não foi possível carregar estes recursos.")}</h3>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          {t("Tentar novamente")}</button>
      </div>
    );
  return result.items.length ? (
    <div className="catalog-grid mt-7">
      {result.items.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  ) : (
    <div className="catalog-empty">
      <h3 className="text-lg font-medium">
        {kind === "markdown"
          ? t("Nenhum arquivo publicado ainda.")
          : t("Nenhum MCP divulgado ainda.")}
      </h3>
      <p>
        {owner
          ? t("Seus rascunhos continuam privados até você publicar.")
          : t("As próximas ideias deste criador aparecerão aqui.")}
      </p>
      {owner && (
        <Link
          href={`/home/resources/new?kind=${kind}`}
          className="workflow-button"
        >
          {kind === "markdown" ? t("Criar arquivo") : t("Divulgar MCP")}
        </Link>
      )}
    </div>
  );
}
