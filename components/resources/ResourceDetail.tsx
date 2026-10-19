"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import ResourceClients from "./ResourceClients";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Code2,
  Copy,
  Download,
  FileText,
  Pencil,
  Share2,
} from "lucide-react";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import { LikeButton } from "@/components/social/SocialControls";
import PromptComments from "@/components/prompts/PromptComments";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { creatorProfileHref } from "@/lib/usernames";
import {
  downloadMarkdown,
  resourceCatalogHref,
  resourceConfiguration,
  type CatalogResource,
} from "@/lib/resources";
import {
  readResourceFavorites,
  setResourceFavorite,
} from "@/lib/supabase/resources";
import MarkdownContent from "./MarkdownContent";
import "./resources.css";
function ResourceDetailSession({ resource }: { resource: CatalogResource }) {
 const { t, intlLocale } = useI18n();

  const { user } = useOnboarding(),
    { requestLogin } = useSiteLayout();
  const [source, setSource] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [favorite, setFavorite] = useState(false),
    [pending, setPending] = useState(false),
    [favoriteReady, setFavoriteReady] = useState(false);
  const doc = resource.document,
    markdown = resource.kind === "markdown";
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void readResourceFavorites(user)
      .then((ids) => {
        if (alive) {
          setFavorite(ids.includes(resource.id));
          setFavoriteReady(true);
        }
      })
      .catch(() => {
        if (alive)
          setError(
            "Não foi possível carregar seus favoritos. Recarregue a página para tentar novamente.",
          );
      });
    return () => {
      alive = false;
    };
  }, [user, resource.id]);
  async function copy(value: string, message: string) {
    setError("");
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
    } catch {
      setError(
        t("Não foi possível copiar. Selecione o texto e copie manualmente."),
      );
    }
  }
  async function saveFavorite() {
    if (!user) {
      requestLogin();
      return;
    }
    setPending(true);
    setError("");
    try {
      await setResourceFavorite(user, resource.id, !favorite);
      setFavorite(!favorite);
    } catch {
      setError(t("Não foi possível atualizar o favorito. Tente novamente."));
    } finally {
      setPending(false);
    }
  }
  const configuration = markdown ? "" : resourceConfiguration(doc);
  return (
    <main className="catalog-page resource-detail">
      <Link href={resourceCatalogHref(resource.kind)} className="resource-back">
        <ArrowLeft size={16} />
        {markdown ? t("Arquivos Markdown") : t("Diretório de MCPs")}
      </Link>
      <header className="resource-detail-heading">
        <div>
          <h1>{doc.title}</h1>
          <p className="resource-lead">{doc.summary}</p>
          <CreatorIdentity
            {...resource.creator}
            href={creatorProfileHref(
              resource.creator_id,
              resource.creator.username,
            )}
          />
        </div>
        <div className="resource-detail-social">
          <LikeButton
            creatorId={resource.creator_id}
            promptId={`resource_${resource.id}`}
          />
          <button
            type="button"
            aria-label={
              favorite ? t("Remover dos favoritos") : t("Salvar nos favoritos")
            }
            aria-pressed={favorite}
            disabled={pending || (Boolean(user) && !favoriteReady)}
            onClick={() => void saveFavorite()}
          >
            <Bookmark size={20} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            aria-label={t("Copiar link da publicação")}
            onClick={() => void copy(window.location.href, "Link copiado.")}
          >
            <Share2 size={20} />
          </button>
          {user?.uid === resource.creator_id && (
            <Link
              aria-label={t("Editar publicação")}
              href={`/home/resources/${resource.id}/edit`}
            >
              <Pencil size={20} />
            </Link>
          )}
        </div>
      </header>
      <div className="resource-detail-grid">
        <article className="resource-detail-body">
          <div className="resource-document-toolbar">
            <div>
              {markdown ? (
                <>
                  <button
                    type="button"
                    aria-pressed={!source}
                    onClick={() => setSource(false)}
                  >
                    <FileText size={16} />
                    {t("Prévia")}</button>
                  <button
                    type="button"
                    aria-pressed={source}
                    onClick={() => setSource(true)}
                  >
                    <Code2 size={16} />
                    {t("Código")}</button>
                </>
              ) : (
                <h2>{t("Sobre este MCP")}</h2>
              )}
            </div>
            {markdown && <span>{doc.fileName}</span>}
          </div>
          {markdown ? (
            source ? (
              <pre className="resource-source">{doc.content}</pre>
            ) : (
              <MarkdownContent content={doc.content} />
            )
          ) : (
            <div className="resource-mcp-about">
              <p>{doc.description || doc.summary}</p>
              <dl>
                <div>
                  <dt>{t("Desenvolvedor")}</dt>
                  <dd>{doc.developer}</dd>
                </div>
                <div>
                  <dt>{t("Divulgado por")}</dt>
                  <dd>
                    <CreatorIdentity
                      {...resource.creator}
                      href={creatorProfileHref(
                        resource.creator_id,
                        resource.creator.username,
                      )}
                    />
                  </dd>
                </div>
                <div>
                  <dt>{t("Conexão")}</dt>
                  <dd>
                    {doc.transport === "remote"
                      ? t("Remota (HTTP)")
                      : t("Local (stdio)")}
                  </dd>
                </div>
                <div>
                  <dt>{t("Autenticação")}</dt>
                  <dd>{doc.authentication || t("Não informada pelo autor")}</dd>
                </div>
                <div>
                  <dt>{t("Permissões")}</dt>
                  <dd>
                    {doc.permissions || t("Consulte a documentação oficial")}
                  </dd>
                </div>
                <div>
                  <dt>{t("Custo")}</dt>
                  <dd>{doc.pricing || t("Consulte o site oficial")}</dd>
                </div>
              </dl>
            </div>
          )}
          {markdown && doc.description && (
            <section className="resource-detail-section">
              <h2>{t("Sobre este arquivo")}</h2>
              <p>{doc.description}</p>
            </section>
          )}
          <section className="resource-detail-section">
            <h2>{t("Como usar")}</h2>
            <p>{doc.instructions}</p>
          </section>
          {!markdown && (
            <section className="resource-detail-section">
              <div className="resource-section-heading">
                <h2>{t("Configuração")}</h2>
                <button
                  type="button"
                  onClick={() =>
                    void copy(configuration, "Configuração copiada.")
                  }
                >
                  <Copy size={16} />
                  {t("Copiar JSON")}</button>
              </div>
              <p className="mb-4 text-sm text-muted">
                {t("Adapte ao seu cliente de IA e preencha suas próprias credenciais, quando necessário.")}</p>
              <pre className="resource-source">{configuration}</pre>
            </section>
          )}
          <section className="resource-detail-section">
            <h2>{t("Créditos e licença")}</h2>
            <p>{doc.license}</p>
            {doc.credits && <p>{doc.credits}</p>}
          </section>
        </article>
        <aside className="resource-detail-aside">
          <div className="resource-download-panel">
            <h2>
              {markdown ? t("Leve para o seu projeto") : t("Conheça o servidor")}
            </h2>
            <p>
              {markdown
                ? t("Copie as instruções ou baixe o arquivo no formato original.")
                : t("Acesse o projeto oficial ou copie a configuração para seu cliente de IA.")}
            </p>
            <button
              type="button"
              className="workflow-button"
              onClick={() =>
                void copy(
                  markdown ? doc.content : configuration,
                  markdown ? "Arquivo copiado." : "Configuração copiada.",
                )
              }
            >
              <Copy size={16} />
              {markdown ? t("Copiar arquivo") : t("Copiar configuração")}
            </button>
            {markdown ? (
              <button
                type="button"
                className="workflow-button secondary"
                onClick={() => {
                  try {
                    downloadMarkdown(doc);
                    setNotice(t("Download iniciado."));
                  } catch {
                    setError(
                      t("Não foi possível baixar. Você pode copiar o conteúdo do arquivo."),
                    );
                  }
                }}
              >
                <Download size={16} />
                {t("Baixar")}{" "}{doc.fileName}
              </button>
            ) : (
              <>
                {[
                  ["Site oficial", doc.website],
                  ["Documentação", doc.documentation],
                  ["Repositório", doc.repository],
                ]
                  .filter(([, url]) => url)
                  .map(([label, url]) => (
                    <a
                      key={t(label)}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-official-link"
                    >
                      {t(label)}
                      <ArrowUpRight size={17} />
                    </a>
                  ))}
                <p className="resource-notice">
                  {t("Este é um diretório. O Mind não instala nem conecta este servidor automaticamente.")}</p>
              </>
            )}
            <dl className="resource-facts">
              <div>
                <dt>{t("Categoria")}</dt>
                <dd>{doc.category}</dd>
              </div>
              <div>
                <dt>{t("Compatível com")}</dt>
                <dd><ResourceClients clients={doc.clients}/></dd>
              </div>
              <div>
                <dt>{t("Atualizado em")}</dt>
                <dd>
                  {new Date(resource.updated_at).toLocaleDateString(intlLocale, {
                    timeZone: "UTC",
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
      <p role="status" className="resource-status">
        {notice && (
          <>
            <Check size={16} />
            {t(notice)}
          </>
        )}
      </p>
      {error && (
        <p role="alert" className="resource-error">
          {t(error)}
        </p>
      )}
      <PromptComments
        creatorId={resource.creator_id}
        promptId={`resource_${resource.id}`}
        resource
      />
    </main>
  );
}

export default function ResourceDetail({
  resource,
}: {
  resource: CatalogResource;
}) {
  const { user } = useOnboarding();
  return (
    <ResourceDetailSession key={user?.uid ?? "visitor"} resource={resource} />
  );
}
