"use client";
/* eslint-disable @next/next/no-img-element -- Reviews the creator's optimized cover before publication. */
import { useI18n } from "@/components/preferences/PreferencesProvider";
import ResourceClients from "./ResourceClients";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import {
  resourceConfiguration,
  resourceLabel,
  type ResourceDocument,
  type ResourceIdentity,
  type ResourceKind,
} from "@/lib/resources";
import MarkdownContent from "./MarkdownContent";
export default function ResourceReview({
  doc,
  kind,
  creator,
  creatorHref,
}: {
  doc: ResourceDocument;
  kind: ResourceKind;
  creator: ResourceIdentity;
  creatorHref: string;
}) {
 const { t } = useI18n();

  const connection =
    kind === "mcp"
      ? [
          ["Desenvolvedor", doc.developer],
          ["Site oficial", doc.website],
          ["Documentação", doc.documentation],
          ["Repositório", doc.repository],
          [
            "Conexão",
            doc.transport === "remote" ? "Remota (HTTP)" : "Local (stdio)",
          ],
          [
            doc.transport === "remote" ? "URL do servidor" : "Comando",
            doc.transport === "remote" ? doc.remoteUrl : doc.command,
          ],
          ["Argumentos", doc.transport === "stdio" ? doc.args : ""],
          ["Autenticação", doc.authentication],
          ["Permissões", doc.permissions],
          ["Custo / plano", doc.pricing],
        ].filter(([, value]) => Boolean(value))
      : [];
  return (
    <div className="resource-review">
      <article>
        <div className="resource-review-meta">
          <span>{resourceLabel(kind)}</span>
          <span>{doc.category}</span>
        </div>
        <h2>{doc.title}</h2>
        <p className="resource-lead">{doc.summary}</p>
        <CreatorIdentity {...creator} href={creatorHref} />
        {doc.coverUrl && (
          <figure className="resource-review-cover">
            <img src={doc.coverUrl} alt={t("Capa escolhida para a publicação")} />
            <figcaption>{t("Capa da publicação")}</figcaption>
          </figure>
        )}
        {doc.description && (
          <section>
            <h3>{t("Sobre este recurso")}</h3>
            <p className="whitespace-pre-wrap">{doc.description}</p>
          </section>
        )}
        <div className="resource-review-content">
          {kind === "markdown" ? (
            <>
              <h3 className="resource-review-filename">{doc.fileName}</h3>
              <MarkdownContent content={doc.content} />
            </>
          ) : (
            <>
              <h3>{t("Configuração")}</h3>
              <pre>{resourceConfiguration(doc)}</pre>
              <dl className="resource-review-facts">
                {connection.map(([label, value]) => (
                  <div key={t(label)}>
                    <dt>{t(label)}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
        <h3>{t("Como usar")}</h3>
        <p className="whitespace-pre-wrap">{doc.instructions}</p>
        <dl className="resource-review-facts">
          <div>
            <dt>{t("Ferramentas compatíveis")}</dt>
            <dd><ResourceClients clients={doc.clients} empty="Nenhuma informada"/></dd>
          </div>
          <div>
            <dt>{t("Licença / condições de uso")}</dt>
            <dd>{doc.license}</dd>
          </div>
          {doc.credits && (
            <div>
              <dt>{t("Créditos / fonte original")}</dt>
              <dd>{doc.credits}</dd>
            </div>
          )}
        </dl>
      </article>
      <aside>
        <h2>{t("Sua publicação ficará pública")}</h2>
        <p>
          {t("Confira a capa, o conteúdo e os detalhes. Qualquer pessoa poderá abrir e compartilhar o link. Você pode voltar para rascunho depois.")}</p>
        {kind === "mcp" && (
          <p>
            {t("Este cadastro divulga o MCP. Não instala nem conecta o servidor à conta de quem visita.")}</p>
        )}
      </aside>
    </div>
  );
}
