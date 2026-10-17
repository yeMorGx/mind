"use client";
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
        "Não foi possível copiar. Selecione o texto e copie manualmente.",
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
      setError("Não foi possível atualizar o favorito. Tente novamente.");
    } finally {
      setPending(false);
    }
  }
  const configuration = markdown ? "" : resourceConfiguration(doc);
  return (
    <main className="catalog-page resource-detail">
      <Link href={resourceCatalogHref(resource.kind)} className="resource-back">
        <ArrowLeft size={16} />
        {markdown ? "Arquivos Markdown" : "Diretório de MCPs"}
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
              favorite ? "Remover dos favoritos" : "Salvar nos favoritos"
            }
            aria-pressed={favorite}
            disabled={pending || (Boolean(user) && !favoriteReady)}
            onClick={() => void saveFavorite()}
          >
            <Bookmark size={20} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            aria-label="Copiar link da publicação"
            onClick={() => void copy(window.location.href, "Link copiado.")}
          >
            <Share2 size={20} />
          </button>
          {user?.uid === resource.creator_id && (
            <Link
              aria-label="Editar publicação"
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
                    Prévia
                  </button>
                  <button
                    type="button"
                    aria-pressed={source}
                    onClick={() => setSource(true)}
                  >
                    <Code2 size={16} />
                    Código
                  </button>
                </>
              ) : (
                <h2>Sobre este MCP</h2>
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
                  <dt>Desenvolvedor</dt>
                  <dd>{doc.developer}</dd>
                </div>
                <div>
                  <dt>Divulgado por</dt>
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
                  <dt>Conexão</dt>
                  <dd>
                    {doc.transport === "remote"
                      ? "Remota (HTTP)"
                      : "Local (stdio)"}
                  </dd>
                </div>
                <div>
                  <dt>Autenticação</dt>
                  <dd>{doc.authentication || "Não informada pelo autor"}</dd>
                </div>
                <div>
                  <dt>Permissões</dt>
                  <dd>
                    {doc.permissions || "Consulte a documentação oficial"}
                  </dd>
                </div>
                <div>
                  <dt>Custo</dt>
                  <dd>{doc.pricing || "Consulte o site oficial"}</dd>
                </div>
              </dl>
            </div>
          )}
          {markdown && doc.description && (
            <section className="resource-detail-section">
              <h2>Sobre este arquivo</h2>
              <p>{doc.description}</p>
            </section>
          )}
          <section className="resource-detail-section">
            <h2>Como usar</h2>
            <p>{doc.instructions}</p>
          </section>
          {!markdown && (
            <section className="resource-detail-section">
              <div className="resource-section-heading">
                <h2>Configuração</h2>
                <button
                  type="button"
                  onClick={() =>
                    void copy(configuration, "Configuração copiada.")
                  }
                >
                  <Copy size={16} />
                  Copiar JSON
                </button>
              </div>
              <p className="mb-4 text-sm text-muted">
                Adapte ao seu cliente de IA e preencha suas próprias
                credenciais, quando necessário.
              </p>
              <pre className="resource-source">{configuration}</pre>
            </section>
          )}
          <section className="resource-detail-section">
            <h2>Créditos e licença</h2>
            <p>{doc.license}</p>
            {doc.credits && <p>{doc.credits}</p>}
          </section>
        </article>
        <aside className="resource-detail-aside">
          <div className="resource-download-panel">
            <h2>
              {markdown ? "Leve para o seu projeto" : "Conheça o servidor"}
            </h2>
            <p>
              {markdown
                ? "Copie as instruções ou baixe o arquivo no formato original."
                : "Acesse o projeto oficial ou copie a configuração para seu cliente de IA."}
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
              {markdown ? "Copiar arquivo" : "Copiar configuração"}
            </button>
            {markdown ? (
              <button
                type="button"
                className="workflow-button secondary"
                onClick={() => {
                  try {
                    downloadMarkdown(doc);
                    setNotice("Download iniciado.");
                  } catch {
                    setError(
                      "Não foi possível baixar. Você pode copiar o conteúdo do arquivo.",
                    );
                  }
                }}
              >
                <Download size={16} />
                Baixar {doc.fileName}
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
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-official-link"
                    >
                      {label}
                      <ArrowUpRight size={17} />
                    </a>
                  ))}
                <p className="resource-notice">
                  Este é um diretório. O Mind não instala nem conecta este
                  servidor automaticamente.
                </p>
              </>
            )}
            <dl className="resource-facts">
              <div>
                <dt>Categoria</dt>
                <dd>{doc.category}</dd>
              </div>
              <div>
                <dt>Compatível com</dt>
                <dd><ResourceClients clients={doc.clients}/></dd>
              </div>
              <div>
                <dt>Atualizado em</dt>
                <dd>
                  {new Date(resource.updated_at).toLocaleDateString("pt-BR", {
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
            {notice}
          </>
        )}
      </p>
      {error && (
        <p role="alert" className="resource-error">
          {error}
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
