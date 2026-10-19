"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import ResourceClients from "./ResourceClients";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCode2, Plug, Plus } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import {
  deleteResource,
  listOwnResources,
  readResourceFavorites,
  saveResource,
} from "@/lib/supabase/resources";
import { requireSupabaseClient } from "@/lib/supabase/client";
import { resourceError, type Resource } from "@/lib/resources";
import "./resources.css";
function ResourceLibrarySession() {
 const { t } = useI18n();

  const { user, authReady } = useOnboarding(),
    { requestLogin } = useSiteLayout();
  const [items, setItems] = useState<Resource[]>([]),
    [saved, setSaved] = useState<Resource[]>([]),
    [tab, setTab] = useState("all"),
    [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState(""),
    [confirm, setConfirm] = useState<{
      id: string;
      action: "delete" | "unpublish";
    } | null>(null),
    [revision, setRevision] = useState(0),
    [savedFailed, setSavedFailed] = useState(false);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void listOwnResources(user)
      .then((rows) => {
        if (alive) {
          setItems(rows);
          setLoaded(true);
          setFailed(false);
        }
      })
      .catch((failure) => {
        if (alive) {
          setError(resourceError(failure));
          setLoaded(true);
          setFailed(true);
        }
      });
    void readResourceFavorites(user)
      .then(async (ids) => {
        if (!ids.length) return [];
        const { data, error } = await requireSupabaseClient()
          .from("mind_resources")
          .select("*")
          .in("id", ids)
          .eq("status", "published");
        if (error) throw error;
        return data as Resource[];
      })
      .then((rows) => {
        if (alive) {
          setSaved(rows);
          setSavedFailed(false);
        }
      })
      .catch(() => {
        if (alive) setSavedFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [user, revision]);
  async function mutate() {
    if (!user || !confirm || pending) return;
    const item = items.find((row) => row.id === confirm.id);
    if (!item) return;
    setPending(item.id);
    setError("");
    try {
      if (confirm.action === "delete") {
        await deleteResource(user, item.id);
        setItems((current) => current.filter((row) => row.id !== item.id));
      } else {
        const value = await saveResource(
          user,
          { ...item, status: "draft" },
          item.updated_at,
        );
        setItems((current) =>
          current.map((row) => (row.id === item.id ? value : row)),
        );
      }
      setConfirm(null);
    } catch (failure) {
      setError(resourceError(failure));
    } finally {
      setPending("");
    }
  }
  if (!authReady)
    return (
      <main className="catalog-page">
        <p role="status">{t("Carregando…")}</p>
      </main>
    );
  if (!user)
    return (
      <main className="catalog-page">
        <div className="catalog-empty">
          <h1>{t("Sua biblioteca de recursos.")}</h1>
          <p>{t("Entre para gerenciar seus arquivos Markdown e MCPs.")}</p>
          <button onClick={requestLogin}>{t("Entrar na conta")}</button>
        </div>
      </main>
    );
  const visible =
    tab === "saved"
      ? saved
      : items.filter((item) => tab === "all" || item.kind === tab);
  return (
    <main className="catalog-page resource-library">
      <div className="explore-heading">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("Arquivos e MCPs")}</h1>
          <p className="mt-2 text-sm text-muted">
            {t("Seus rascunhos, publicações e recursos salvos.")}</p>
        </div>
        <div className="resource-actions">
          <Link
            href="/home/resources/new?kind=markdown"
            className="workflow-button"
          >
            <Plus size={16} />
            {t("Arquivo Markdown")}</Link>
          <Link
            href="/home/resources/new?kind=mcp"
            className="workflow-button secondary"
          >
            <Plus size={16} />
            MCP
          </Link>
        </div>
      </div>
      <div className="resource-tabs" aria-label={t("Filtrar recursos")}>
        {[
          ["all", "Meus recursos"],
          ["markdown", "Markdown"],
          ["mcp", "MCPs"],
          ["saved", "Salvos"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {t(label)}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="resource-error">
          {t(error)}
        </p>
      )}
      {!loaded ? (
        <p role="status" className="py-12 text-muted">
          {t("Carregando recursos…")}</p>
      ) : failed || (tab === "saved" && savedFailed) ? (
        <div className="catalog-empty">
          <h2>{t("Não foi possível carregar esta área.")}</h2>
          <p>{t("Confira sua conexão ou tente novamente em breve.")}</p>
          <button onClick={() => setRevision((value) => value + 1)}>
            {t("Tentar novamente")}</button>
        </div>
      ) : visible.length ? (
        <div className="resource-library-list">
          {visible.map((item) => (
            <article key={item.id}>
              <div className="resource-library-symbol">
                {item.kind === "markdown" ? (
                  <FileCode2 size={24} />
                ) : (
                  <Plug size={24} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={
                    tab === "saved"
                      ? `/resources/${item.id}`
                      : `/home/resources/${item.id}/edit`
                  }
                  className="break-words font-semibold"
                >
                  {item.document.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {item.kind === "markdown" ? item.document.fileName : "MCP"} ·{" "}
                  {item.status === "draft" ? t("Rascunho privado") : t("Publicado")}
                </p>
                <ResourceClients clients={item.document.clients} compact/>
              </div>
              {tab !== "saved" && (
                <div className="resource-library-actions">
                  <Link href={`/home/resources/${item.id}/edit`}>{t("Editar")}</Link>
                  {item.status === "published" && (
                    <>
                      <Link href={`/resources/${item.id}`}>{t("Ver página")}</Link>
                      <button
                        disabled={Boolean(pending)}
                        onClick={() =>
                          setConfirm({ id: item.id, action: "unpublish" })
                        }
                      >
                        {t("Tornar privado")}</button>
                    </>
                  )}
                  <button
                    disabled={Boolean(pending)}
                    onClick={() =>
                      setConfirm({ id: item.id, action: "delete" })
                    }
                  >
                    {t("Excluir")}</button>
                </div>
              )}
              {confirm?.id === item.id && (
                <div className="resource-delete-confirm">
                  <p>
                    {confirm.action === "delete"
                      ? t("Excluir este recurso permanentemente?")
                      : t("Retirar da página pública? O rascunho será preservado.")}
                  </p>
                  <button
                    disabled={Boolean(pending)}
                    onClick={() => void mutate()}
                  >
                    {pending ? t("Salvando…") : t("Confirmar")}
                  </button>
                  <button
                    disabled={Boolean(pending)}
                    onClick={() => setConfirm(null)}
                  >
                    {t("Cancelar")}</button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <h2>
            {tab === "saved"
              ? t("Guarde suas próximas referências.")
              : t("Dê espaço às suas ideias.")}
          </h2>
          <p>
            {tab === "saved"
              ? t("Salve arquivos e MCPs pelo ícone de favorito na página de cada recurso.")
              : t("Crie um arquivo Markdown ou divulgue um MCP. Ele começa como rascunho privado.")}
          </p>
        </div>
      )}
    </main>
  );
}

export default function ResourceLibrary() {
  const { user } = useOnboarding();
  return <ResourceLibrarySession key={user?.uid ?? "visitor"} />;
}
