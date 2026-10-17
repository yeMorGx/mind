"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Archive,
  Megaphone,
  Pause,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { campaignRequest } from "@/lib/campaigns/client";
import {
  campaignState,
  CAMPAIGN_PLACEMENTS,
  type Campaign,
  type CampaignDraft,
  type CampaignStatus,
} from "@/lib/campaigns/types";
import { CampaignEditor } from "./CampaignEditor";
import "./campaign-manager.css";
type Result = { campaigns: Campaign[]; total: number };
function ManagerSession() {
  const { user, authReady } = useOnboarding(),
    { requestLogin } = useSiteLayout();
  const [result, setResult] = useState<Result | null>(null),
    [page, setPage] = useState(0),
    [version, setVersion] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [editor, setEditor] = useState<Campaign | "new" | null>(null),
    [busy, setBusy] = useState("");
  const lock = useRef(false),
    newId = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void campaignRequest<Result>(user, "list", { page })
      .then((value) => {
        if (alive) {
          setResult(value);
          setError("");
        }
      })
      .catch((failure) => {
        if (alive) {
          setResult(null);
          setError(
            failure instanceof Error
              ? failure.message
              : "Não foi possível carregar as campanhas.",
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user, page, version]);
  function reload() {
    setLoading(true);
    setError("");
    setVersion((v) => v + 1);
  }
  async function save(
    draft: CampaignDraft,
    status: CampaignStatus,
    confirmed: boolean,
  ) {
    if (!user) return;
    await campaignRequest(user, "save", {
      id:
        editor && editor !== "new"
          ? editor.id
          : (newId.current ?? (newId.current = crypto.randomUUID())),
      version: editor && editor !== "new" ? editor.updated_at : null,
      status,
      campaign: draft,
      confirmed,
    });
    newId.current = null;
    setEditor(null);
    setMessage(
      status === "active"
        ? "Divulgação salva. O período escolhido define quando ela aparece no Explorar."
        : "Campanha salva fora do ar.",
    );
    reload();
  }
  async function change(campaign: Campaign, status: "paused" | "archived") {
    if (!user || lock.current) return;
    if (
      !window.confirm(
        status === "paused"
          ? "Pausar esta divulgação? Ela sairá do Explorar."
          : "Arquivar esta campanha? Ela sairá do Explorar e as métricas serão preservadas.",
      )
    )
      return;
    lock.current = true;
    setBusy(campaign.id);
    setError("");
    setMessage("");
    try {
      await campaignRequest(user, "state", {
        id: campaign.id,
        version: campaign.updated_at,
        status,
      });
      setMessage(
        status === "paused" ? "Campanha pausada." : "Campanha arquivada.",
      );
      reload();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível atualizar a campanha.",
      );
    } finally {
      lock.current = false;
      setBusy("");
    }
  }
  if (!authReady)
    return (
      <main className="campaign-manager">
        <p role="status">Carregando sua conta…</p>
      </main>
    );
  if (!user)
    return (
      <main className="campaign-manager">
        <h1>Campanhas</h1>
        <p className="campaign-intro">
          Entre na conta administradora para gerenciar divulgações.
        </p>
        <button
          type="button"
          className="workflow-button"
          onClick={requestLogin}
        >
          Entrar
        </button>
      </main>
    );
  if (editor)
    return (
      <main className="campaign-manager">
        <CampaignEditor
          key={editor === "new" ? "new" : editor.id}
          initial={editor === "new" ? undefined : editor}
          onSave={save}
          onCancel={() => {
            newId.current = null;
            setEditor(null);
            setError("");
          }}
        />
      </main>
    );
  return (
    <main className="campaign-manager">
      <Link className="campaign-back" href="/home/settings">
        <ArrowLeft size={16} />
        Configurações
      </Link>
      <div className="campaign-page-heading">
        <div>
          <h1>Campanhas</h1>
          <p>
            Gerencie cards patrocinados e destaques de afiliados e parceiros.
          </p>
        </div>
        <button
          type="button"
          className="workflow-button"
          disabled={loading || !result || Boolean(busy)}
          onClick={() => {
            setMessage("");
            setEditor("new");
          }}
        >
          <Plus size={17} />
          Nova campanha
        </button>
      </div>
      <div className="campaign-toolbar">
        <h2>Suas campanhas</h2>
        <button
          type="button"
          className="campaign-back"
          disabled={loading || Boolean(busy)}
          onClick={reload}
        >
          <RefreshCw size={15} />
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>
      <p className="campaign-hint">
        Escolha cards em Prompts, MCPs e Markdown, o hero do Explorar ou combine
        os espaços. Exibimos no máximo uma campanha por página, sem repetir no
        hero e na grade.
      </p>
      {message && (
        <p className="campaign-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <div className="campaign-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="workflow-button secondary"
            disabled={loading}
            onClick={reload}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {loading ? (
        <div className="campaign-loading" role="status">
          Carregando campanhas e métricas…
        </div>
      ) : (
        result && (
          <>
            <CampaignList
              items={result.campaigns}
              busy={busy}
              onEdit={setEditor}
              onState={(c, s) => void change(c, s)}
            />
            {result.total > 20 && (
              <nav
                className="campaign-pagination"
                aria-label="Páginas de campanhas"
              >
                <button
                  type="button"
                  className="workflow-button secondary"
                  disabled={!page}
                  onClick={() => {
                    setLoading(true);
                    setPage((v) => v - 1);
                  }}
                >
                  Anterior
                </button>
                <span>Página {page + 1}</span>
                <button
                  type="button"
                  className="workflow-button secondary"
                  disabled={(page + 1) * 20 >= result.total}
                  onClick={() => {
                    setLoading(true);
                    setPage((v) => v + 1);
                  }}
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )
      )}
      <div className="campaign-footnote">
        <p>
          Visualizações e cliques são estimativas: um evento de cada tipo por
          sessão do navegador, por campanha e por dia UTC. A visualização conta
          quando metade do destaque fica visível por um segundo ou quando a
          pessoa clica.
        </p>
        <p>
          Vendas e comissões são acompanhadas na plataforma de afiliados.{" "}
          <Link href="/explore">
            Ver o Explorar
            <ArrowUpRight size={13} />
          </Link>
        </p>
      </div>
    </main>
  );
}
export function CampaignList({
  items,
  busy = "",
  onEdit,
  onState,
}: {
  items: Campaign[];
  busy?: string;
  onEdit: (c: Campaign) => void;
  onState: (c: Campaign, s: "paused" | "archived") => void;
}) {
  if (!items.length)
    return (
      <div className="campaign-empty">
        <Megaphone size={28} />
        <h3>Seu próximo parceiro começa aqui.</h3>
        <p>
          Crie uma campanha, confira a prévia e escolha quando colocá-la no ar.
          Nada é publicado sem sua confirmação.
        </p>
      </div>
    );
  return (
    <div className="campaign-list">
      {items.map((c) => {
        const state = campaignState(c);
        return (
          <article key={c.id} className="campaign-row">
            <div className="campaign-row-main">
              <span
                className="campaign-state"
                data-active={state === "No ar" || undefined}
              >
                {state}
              </span>
              <h3>{c.name}</h3>
              <p>
                {c.placements.map((p) => CAMPAIGN_PLACEMENTS[p]).join(" · ")}
              </p>
              <p>
                {c.advertiser} ·{" "}
                {c.kind === "affiliate" ? "Afiliado" : "Parceria paga"}
              </p>
              <p>
                {c.starts_at
                  ? `${new Date(c.starts_at).toLocaleDateString("pt-BR")} → ${c.ends_at ? new Date(c.ends_at).toLocaleDateString("pt-BR") : "Sem data final"}`
                  : "Período não definido"}
              </p>
            </div>
            <dl className="campaign-metrics">
              <div>
                <dt>Visualizações</dt>
                <dd>{c.views.toLocaleString("pt-BR")}</dd>
              </div>
              <div>
                <dt>Cliques</dt>
                <dd>{c.clicks.toLocaleString("pt-BR")}</dd>
              </div>
              <div>
                <dt>Taxa de cliques</dt>
                <dd>
                  {c.views
                    ? `${((c.clicks / c.views) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                    : "—"}
                </dd>
              </div>
            </dl>
            <div className="campaign-row-actions">
              <button
                type="button"
                className="workflow-button secondary"
                disabled={Boolean(busy)}
                onClick={() => onEdit(c)}
              >
                Editar e revisar
              </button>
              {c.status === "active" && (
                <button
                  type="button"
                  className="campaign-icon-button"
                  title="Pausar campanha"
                  aria-label={`Pausar ${c.name}`}
                  disabled={Boolean(busy)}
                  onClick={() => onState(c, "paused")}
                >
                  <Pause size={17} />
                </button>
              )}
              {c.status !== "archived" && (
                <button
                  type="button"
                  className="campaign-icon-button"
                  title="Arquivar campanha"
                  aria-label={`Arquivar ${c.name}`}
                  disabled={Boolean(busy)}
                  onClick={() => onState(c, "archived")}
                >
                  <Archive size={17} />
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
export default function CampaignManager() {
  const { user } = useOnboarding();
  return <ManagerSession key={user?.uid ?? "visitor"} />;
}
