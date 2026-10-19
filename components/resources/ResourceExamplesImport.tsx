"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import ResourceClients from "./ResourceClients";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileCode2, Loader2, Plug } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { publishResourceExamples, resourceExamples, type ExampleImportResult } from "@/lib/resource-examples";
import { resourceError, type ResourceKind } from "@/lib/resources";
import MarkdownContent from "./MarkdownContent";
import "./resources.css";

function ImportSession({ kind }: { kind?: ResourceKind }) {
 const { t } = useI18n();

  const examples = kind ? resourceExamples.filter(example => example.kind === kind) : resourceExamples;
  const title = kind === "mcp" ? t("Dois MCPs para a sua conta") : kind === "markdown" ? t("Três arquivos Markdown para a sua conta") : t("Cinco exemplos para a sua conta");
  const description = kind === "mcp" ? t("GitHub e Supabase, com configurações, instruções e links oficiais.") : kind === "markdown" ? t("DESIGN.md, SKILL.md e CLAUDE.md, com conteúdo e instruções de uso.") : t("Três arquivos Markdown e dois MCPs, com conteúdo, instruções e links oficiais.");
  const { user, authReady } = useOnboarding();
  const { requestLogin } = useSiteLayout();
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<ExampleImportResult[]>([]);
  const [error, setError] = useState("");
  async function publish() {
    if (!user || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await publishResourceExamples(user, setResults, kind);
      setDone(true);
    } catch (failure) {
      setError(t("{v0} Os itens já adicionados foram preservados; você pode tentar novamente.", {v0: (resourceError(failure))}));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  if (!authReady) return <main className="catalog-page resource-library"><p role="status" className="py-12 text-center text-muted">{t("Carregando sua conta…")}</p></main>;
  if (!user) return <main className="catalog-page resource-library"><div className="catalog-empty"><h1>{t("Adicione os exemplos à sua conta.")}</h1><p>{t("Entre no Mind para adicionar estes exemplos à sua conta.")}</p><button type="button" onClick={requestLogin}>{t("Entrar na conta")}</button></div></main>;
  const publicCount = results.filter(item => item.status === "published").length;
  return <main className="catalog-page resource-library">
    <Link href="/home/resources" className="resource-back"><ArrowLeft size={16}/>{t("Arquivos e MCPs")}</Link>
    <div className="explore-heading"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description} {t("Ao confirmar, eles ficam públicos no seu perfil e nos catálogos.")}</p></div></div>
    <div className="resource-library-list">{examples.map(example => {
      const result = results.find(item => item.exampleId === example.id);
      const doc = example.document;
      return <article key={example.id}>
        <div className="resource-library-symbol" aria-hidden="true">{example.kind === "markdown" ? <FileCode2 size={24}/> : <Plug size={24}/>}</div>
        <div className="min-w-0 flex-1"><h2 className="font-semibold">{doc.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{doc.summary}</p>{result && <p className="mt-2 flex items-center gap-2 text-sm"><Check size={15}/>{result.created ? t("Publicado na sua conta") : result.status === "published" ? t("Já estava publicado na sua conta") : t("Rascunho existente preservado")}</p>}</div>
        {result && <Link href={result.status === "published" ? `/resources/${result.resourceId}` : `/home/resources/${result.resourceId}/edit`} className="workflow-button secondary">{result.status === "published" ? t("Ver publicação") : t("Ver rascunho")}</Link>}
        <details className="basis-full rounded-xl bg-surface p-5"><summary className="cursor-pointer text-sm font-medium">{t("Conferir conteúdo e instruções")}</summary><div className="mt-5 max-w-3xl text-sm leading-7">
          {example.kind === "markdown" ? <MarkdownContent content={doc.content}/> : <><h3 className="font-semibold">{t("Desenvolvedor:")}{" "}{doc.developer}</h3><p className="mt-3">{doc.description}</p><a className="mt-3 inline-block underline underline-offset-4" href={doc.documentation} target="_blank" rel="noopener noreferrer">{t("Documentação oficial")}</a><pre className="resource-source mt-4 rounded-xl bg-media p-4">{doc.config}</pre><p className="mt-3">{t("Autenticação:")}{" "}{doc.authentication}</p><p className="mt-3">{t("Permissões:")}{" "}{doc.permissions}</p><p className="mt-3">{t("Custo:")}{" "}{doc.pricing}</p></>}
          <h3 className="mt-6 font-semibold">{t("Como usar")}</h3><p className="mt-2 whitespace-pre-wrap">{doc.instructions}</p><div className="mt-4"><p className="mb-2">{t("Ferramentas compatíveis")}</p><ResourceClients clients={doc.clients}/></div><p className="mt-3">{t("Licença:")}{" "}{doc.license}</p><p className="mt-3 text-muted">{doc.credits}</p>
        </div></details>
      </article>;
    })}</div>
    <div className="mt-8 max-w-3xl" aria-live="polite">{busy && <p role="status" className="mb-4 text-sm text-muted">{t("Publicando exemplos:")}{" "}{results.length} {t("de")}{" "}{examples.length} {t("concluídos…")}</p>}{done && <p role="status" className="mb-4 text-sm leading-7">{t("Importação concluída:")}{" "}{publicCount} {publicCount === 1 ? t("exemplo público") : t("exemplos públicos")} {t("na sua conta.")}{results.length > publicCount && t(" Os rascunhos que já existiam foram preservados.")}</p>}{error && <p role="alert" className="resource-error">{t(error)}</p>}</div>
    <div className="resource-actions mt-6">{!done && <button type="button" disabled={busy} className="workflow-button" onClick={() => void publish()}>{busy ? <><Loader2 size={16} className="animate-spin motion-reduce:animate-none"/>{t("Publicando…")}</> : error ? t("Tentar novamente") : t("Publicar os {v0} {v1} na minha conta", {v0: (examples.length), v1: (kind === "mcp" ? "MCPs" : kind === "markdown" ? "arquivos" : "exemplos")})}</button>}{done && <Link href="/home/resources" className="workflow-button">{t("Ver meus arquivos e MCPs")}</Link>}<Link href={`/u/${user.uid}`} className="workflow-button secondary">{t("Ver meu perfil")}</Link></div>
    <p className="mt-4 text-xs leading-6 text-muted">{t("A importação pode ser retomada. Exemplos já adicionados à conta mantêm o conteúdo e o estado de publicação existentes.")}</p>
  </main>;
}
export default function ResourceExamplesImport({ kind }: { kind?: ResourceKind }) {
  const { user } = useOnboarding();
  return <ImportSession key={`${user?.uid ?? "visitor"}:${kind ?? "all"}`} kind={kind}/>;
}
