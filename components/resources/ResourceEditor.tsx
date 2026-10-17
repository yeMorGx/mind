"use client";
import {AnimatedCheckbox} from "@/components/ui/animated-checkbox";
/* eslint-disable @next/next/no-img-element -- Locally optimized uploaded covers use data URLs. */
import { ResourceClientIdentity } from "./ResourceClients";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FileUp, Loader2, Upload, X } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { preparePromptImage } from "@/lib/prompt-media";
import {
  ensureCreatorProfile,
  getOwnProfile,
} from "@/lib/firebase/publication";
import { ownResource, saveResource } from "@/lib/supabase/resources";
import {
  emptyResourceDocument,
  RESOURCE_CATEGORIES,
  RESOURCE_CLIENTS,
  resourceError,
  validateResource,
  type Resource,
  type ResourceDocument,
  type ResourceKind,
  type ResourceIdentity,
} from "@/lib/resources";
import ResourceReview from "./ResourceReview";
import MarkdownContent from "./MarkdownContent";
import "./resources.css";
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="resource-field">
      <label>
        {label}
        {children}
      </label>
      {hint && <p>{hint}</p>}
    </div>
  );
}
function ResourceEditorSession({
  kind: initialKind,
  id,
}: {
  kind: ResourceKind;
  id?: string;
}) {
  const { user, authReady } = useOnboarding();
  const { requestLogin } = useSiteLayout();
  const router = useRouter();
  const [kind, setKind] = useState(initialKind),
    [doc, setDoc] = useState(() => emptyResourceDocument(initialKind));
  const [existing, setExisting] = useState<Resource | null>(null),
    [loaded, setLoaded] = useState(!id),
    [loadFailed, setLoadFailed] = useState(false),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [stage, setStage] = useState<"edit" | "review" | "done">("edit"),
    [preview, setPreview] = useState(false),
    [creator, setCreator] = useState<ResourceIdentity | null>(null);
  const resourceId = useRef(id || ""),
    dirty = useRef(false),
    locked = useRef(false);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void getOwnProfile(user.uid)
      .then((profile) => {
        if (alive)
          setCreator(
            profile ?? {
              name: user.displayName || "Minha conta",
              avatarUrl: user.photoURL || "",
            },
          );
      })
      .catch(() => {});
    if (id)
      void ownResource(user, id)
        .then((value) => {
          if (!alive) return;
          if (!value)
            throw new Error("Esta publicação não foi encontrada na sua conta.");
          setExisting(value);
          setKind(value.kind);
          setDoc(value.document);
          setLoaded(true);
        })
        .catch((failure) => {
          if (alive) {
            setError(resourceError(failure));
            setLoadFailed(true);
            setLoaded(true);
          }
        });
    return () => {
      alive = false;
    };
  }, [user, id]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  function update<K extends keyof ResourceDocument>(
    key: K,
    value: ResourceDocument[K],
  ) {
    dirty.current = true;
    setDoc((current) => ({ ...current, [key]: value }));
    setNotice("");
  }
  async function upload(file: File, cover = false) {
    setUploading(true);
    setError("");
    try {
      if (cover) update("coverUrl", (await preparePromptImage(file)).url);
      else {
        if (!/\.md$/i.test(file.name) || file.size > 100000 || !file.size)
          throw new Error("Escolha um arquivo .md UTF-8 de até 100 KB.");
        const content = new TextDecoder("utf-8", { fatal: true }).decode(
          await file.arrayBuffer(),
        );
        if (
          doc.content &&
          !window.confirm(
            "Substituir o conteúdo atual pelo arquivo selecionado?",
          )
        )
          return;
        update("content", content);
        update("fileName", file.name);
      }
    } catch (failure) {
      setError(resourceError(failure));
    } finally {
      setUploading(false);
    }
  }
  async function persist(publish: boolean) {
    if (!user || locked.current) return;
    if (
      !publish &&
      existing?.status === "published" &&
      !window.confirm(
        "Retirar esta publicação do ar e salvar como rascunho? O conteúdo será preservado e ficará visível apenas para você.",
      )
    )
      return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      validateResource(kind, doc, publish);
      await ensureCreatorProfile(user);
      resourceId.current ||= crypto.randomUUID();
      const value = await saveResource(
        user,
        {
          id: resourceId.current,
          kind,
          document: doc,
          status: publish ? "published" : "draft",
        },
        existing?.updated_at,
      );
      setExisting(value);
      dirty.current = false;
      if (publish) setStage("done");
      else {
        setNotice("Rascunho salvo. Só você pode vê-lo.");
        if (!id) router.replace(`/home/resources/${value.id}/edit`);
      }
    } catch (failure) {
      setError(resourceError(failure));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function review() {
    setError("");
    try {
      validateResource(kind, doc, true);
      setStage("review");
      window.scrollTo(0, 0);
    } catch (failure) {
      setError(resourceError(failure));
    }
  }
  const input = (
    key: keyof ResourceDocument,
    maxLength = 1000,
    placeholder = "",
  ) => (
    <input
      value={String(doc[key])}
      onChange={(event) => update(key, event.target.value as never)}
      maxLength={maxLength}
      placeholder={placeholder}
    />
  );
  const text = (
    key: keyof ResourceDocument,
    maxLength = 5000,
    rows = 4,
    placeholder = "",
  ) => (
    <textarea
      value={String(doc[key])}
      onChange={(event) => update(key, event.target.value as never)}
      maxLength={maxLength}
      rows={rows}
      placeholder={placeholder}
    />
  );
  if (!authReady || (user && !loaded))
    return (
      <main className="catalog-page resource-editor">
        <p role="status" className="py-16 text-center text-muted">
          Carregando publicação…
        </p>
      </main>
    );
  if (!user)
    return (
      <main className="catalog-page resource-editor">
        <div className="catalog-empty">
          <h1>Compartilhe com a comunidade.</h1>
          <p>
            Entre na sua conta para criar um arquivo Markdown ou divulgar um
            MCP.
          </p>
          <button type="button" onClick={requestLogin}>
            Entrar na conta
          </button>
        </div>
      </main>
    );
  if (loadFailed)
    return (
      <main className="catalog-page resource-editor">
        <div className="catalog-empty">
          <h1>Não foi possível abrir a publicação.</h1>
          <p role="alert">{error}</p>
          <Link href="/home/resources">Voltar às minhas publicações</Link>
        </div>
      </main>
    );
  if (stage === "done")
    return (
      <main className="catalog-page resource-editor">
        <div className="resource-published">
          <Check size={36} />
          <h1>Pronto para compartilhar.</h1>
          <p>{doc.title} está público e já aparece no seu perfil.</p>
          <div className="resource-actions">
            <Link
              className="workflow-button"
              href={`/resources/${resourceId.current}`}
            >
              Ver publicação
            </Link>
            <button
              className="workflow-button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/resources/${resourceId.current}`,
                  );
                  setNotice("Link copiado.");
                } catch {
                  setError(
                    "Não foi possível copiar. Abra a publicação e copie o endereço do navegador.",
                  );
                }
              }}
            >
              Copiar link
            </button>
          </div>
          <p role="status">{notice}</p>
          {error && <p role="alert">{error}</p>}
          <Link href="/home/resources" className="text-sm underline">
            Voltar às minhas publicações
          </Link>
        </div>
      </main>
    );
  return (
    <main className="catalog-page resource-editor">
      <Link href="/home/resources" className="resource-back">
        <ArrowLeft size={16} />
        Minhas publicações
      </Link>
      <div className="resource-editor-heading">
        <div>
          <h1>
            {stage === "review"
              ? "Revise antes de publicar"
              : `${id ? "Editar" : "Novo"} ${kind === "mcp" ? "MCP" : "arquivo Markdown"}`}
          </h1>
          <p>
            {stage === "review"
              ? "Confira o que as pessoas vão encontrar na sua página pública."
              : existing?.status === "published"
                ? "Ao publicar as alterações, a página pública será atualizada."
                : "Salve como rascunho e publique quando estiver pronto."}
          </p>
        </div>
        {stage === "edit" && kind === "markdown" && (
          <button
            type="button"
            className="workflow-button secondary"
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? "Editar conteúdo" : "Pré-visualizar"}
          </button>
        )}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (stage === "review") void persist(true);
          else review();
        }}
      >
        {stage === "review" ? (
          <ResourceReview
            doc={doc}
            kind={kind}
            creator={
              creator ?? {
                name: user.displayName || "Minha conta",
                avatarUrl: user.photoURL || "",
              }
            }
            creatorHref={`/u/${user.uid}`}
          />
        ) : (
          <div className="resource-editor-grid">
            <section
              className="resource-editor-main"
              aria-label="Conteúdo da publicação"
            >
              <Field label="Título *">
                {input(
                  "title",
                  120,
                  kind === "markdown"
                    ? "Ex.: Sistema de design para interfaces"
                    : "Nome do servidor MCP",
                )}
              </Field>
              <Field
                label="Descrição breve *"
                hint={`${doc.summary.length}/180 · Aparece no card.`}
              >
                {text("summary", 180, 2, "O que este recurso ajuda a fazer?")}
              </Field>
              {kind === "markdown" ? (
                <>
                  <div className="resource-file-row">
                    <Field label="Nome do arquivo *">
                      {input("fileName", 80, "CLAUDE.md")}
                    </Field>
                    <label className="workflow-button secondary resource-upload">
                      <FileUp size={16} />
                      Importar .md
                      <input
                        type="file"
                        accept=".md,text/markdown,text/plain"
                        disabled={uploading}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void upload(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="resource-field">
                    <label htmlFor="resource-content">
                      Conteúdo do arquivo *
                    </label>
                    {preview ? (
                      <div className="resource-editor-preview">
                        <MarkdownContent
                          content={doc.content || "Seu arquivo aparecerá aqui."}
                        />
                      </div>
                    ) : (
                      <textarea
                        id="resource-content"
                        className="resource-source-editor"
                        value={doc.content}
                        maxLength={100000}
                        onChange={(event) =>
                          update("content", event.target.value)
                        }
                        rows={22}
                        placeholder="# Instruções para o projeto\n\nEscreva aqui o conteúdo do seu arquivo…"
                      />
                    )}
                    <p>
                      {doc.content.length.toLocaleString("pt-BR")}/100.000
                      caracteres · Markdown, sem executar HTML.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2>Links oficiais</h2>
                  <Field
                    label="Desenvolvedor / organização *"
                    hint="Informe quem mantém o MCP. Você aparecerá como quem o divulgou."
                  >
                    {input("developer", 1000)}
                  </Field>
                  <Field label="Site oficial *">
                    {input("website", 2048, "https://")}
                  </Field>
                  <Field label="Documentação *">
                    {input("documentation", 2048, "https://")}
                  </Field>
                  <Field label="Repositório">
                    {input("repository", 2048, "https://github.com/…")}
                  </Field>
                  <h2>Conexão</h2>
                  <Field label="Tipo de conexão">
                    <select
                      value={doc.transport}
                      onChange={(event) =>
                        update(
                          "transport",
                          event.target.value as "remote" | "stdio",
                        )
                      }
                    >
                      <option value="remote">Remota (HTTP)</option>
                      <option value="stdio">Local (stdio)</option>
                    </select>
                  </Field>
                  {doc.transport === "remote" ? (
                    <Field label="URL do servidor">
                      {input("remoteUrl", 2048, "https://exemplo.com/mcp")}
                    </Field>
                  ) : (
                    <>
                      <Field label="Comando">
                        {input("command", 500, "npx")}
                      </Field>
                      <Field label="Argumentos (lista JSON)">
                        {text("args", 5000, 3, '["-y", "nome-do-pacote"]')}
                      </Field>
                    </>
                  )}
                  <Field
                    label="Configuração JSON (opcional)"
                    hint="Use valores de exemplo no lugar de tokens e senhas. Este conteúdo ficará público."
                  >
                    {text("config", 10000, 8, '{ "mcpServers": { … } }')}
                  </Field>
                  <div className="resource-notice">
                    O Mind divulga o MCP. Nenhum comando ou configuração será
                    executado pelo site.
                  </div>
                  <Field label="Autenticação">
                    {input(
                      "authentication",
                      1000,
                      "Ex.: OAuth, token pessoal ou sem autenticação",
                    )}
                  </Field>
                  <Field label="Permissões necessárias">
                    {text(
                      "permissions",
                      1000,
                      3,
                      "Quais dados o servidor poderá acessar?",
                    )}
                  </Field>
                  <Field label="Custo / plano">
                    {input(
                      "pricing",
                      1000,
                      "Ex.: Gratuito ou depende do plano do serviço",
                    )}
                  </Field>
                </>
              )}
              <Field label="Sobre este recurso">
                {text(
                  "description",
                  5000,
                  4,
                  "Contexto, exemplos e o que vale saber antes de usar.",
                )}
              </Field>
              <Field label="Como usar *">
                {text(
                  "instructions",
                  5000,
                  5,
                  kind === "markdown"
                    ? "Onde salvar o arquivo, como ativar e o que adaptar no projeto."
                    : "Como adicionar este servidor a uma ferramenta compatível.",
                )}
              </Field>
            </section>
            <aside className="resource-editor-aside">
              <h2>Detalhes da publicação</h2>
              <Field
                label={
                  kind === "mcp" ? "Logo ou capa (opcional)" : "Capa (opcional)"
                }
                hint="JPEG, PNG ou WebP, até 5 MB. Otimizada ao enviar."
              >
                <span className="resource-cover-upload">
                  {doc.coverUrl ? (
                    <>
                      <img src={doc.coverUrl} alt="Prévia da capa" />
                    </>
                  ) : (
                    <>
                      <Upload size={23} />
                      <span>Escolher imagem</span>
                    </>
                  )}
                  <input
                    aria-label="Escolher capa"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(file, true);
                      event.target.value = "";
                    }}
                  />
                </span>
              </Field>
              {doc.coverUrl && (
                <button
                  type="button"
                  className="mb-6 flex items-center gap-1 text-sm text-muted"
                  onClick={() => update("coverUrl", "")}
                >
                  <X size={15} />
                  Remover capa
                </button>
              )}
              <Field label="Categoria *">
                <select
                  value={doc.category}
                  onChange={(event) => update("category", event.target.value)}
                >
                  <option value="">Selecionar categoria</option>
                  {RESOURCE_CATEGORIES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <fieldset className="resource-clients">
                <legend>Ferramentas compatíveis</legend>
                <p>Selecione apenas as que você conferiu.</p>
                {RESOURCE_CLIENTS.map((value) => (
                  <AnimatedCheckbox key={value}
                      checked={doc.clients.includes(value)}
                      onChange={(event) =>
                        update(
                          "clients",
                          event.target.checked
                            ? [...doc.clients, value]
                            : doc.clients.filter((item) => item !== value),
                        )
                      }
                    >
                    <ResourceClientIdentity value={value}/>
                  </AnimatedCheckbox>
                ))}
              </fieldset>
              <Field label="Licença / condições de uso *">
                {input(
                  "license",
                  1000,
                  "Ex.: MIT, CC BY 4.0 ou link dos termos",
                )}
              </Field>
              <Field label="Créditos / fonte original">
                {text(
                  "credits",
                  1000,
                  3,
                  "Autor original e atribuição, quando houver.",
                )}
              </Field>
            </aside>
          </div>
        )}
        <div className="resource-editor-bottom">
          {error && (
            <p role="alert" className="resource-error">
              {error}
            </p>
          )}
          <p role="status" className="resource-save-notice">
            {notice}
            {uploading && "Preparando arquivo…"}
          </p>
          <div className="resource-editor-bottom-actions">
            <span>
              {stage === "review"
                ? "Última etapa · Confirmar publicação"
                : "Rascunhos ficam privados"}
            </span>
            <div>
              {stage === "review" ? (
                <button
                  type="button"
                  disabled={busy}
                  className="workflow-button secondary"
                  onClick={() => setStage("edit")}
                >
                  Voltar à edição
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || uploading}
                  className="workflow-button secondary"
                  onClick={() => void persist(false)}
                >
                  {busy
                    ? "Salvando…"
                    : existing?.status === "published"
                      ? "Salvar como rascunho"
                      : "Salvar rascunho"}
                </button>
              )}
              <button
                type="submit"
                disabled={busy || uploading}
                className="workflow-button"
              >
                {busy && (
                  <Loader2
                    size={16}
                    className="animate-spin motion-reduce:animate-none"
                  />
                )}
                {stage === "review"
                  ? busy
                    ? "Publicando…"
                    : "Confirmar publicação"
                  : "Revisar publicação"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function ResourceEditor({
  kind,
  id,
}: {
  kind: ResourceKind;
  id?: string;
}) {
  const { user } = useOnboarding();
  return (
    <ResourceEditorSession key={user?.uid ?? "visitor"} kind={kind} id={id} />
  );
}
