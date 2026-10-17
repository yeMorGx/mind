"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileCode2, Loader2, Plug } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { publishResourceExamples, resourceExamples, type ExampleImportResult } from "@/lib/resource-examples";
import { resourceError } from "@/lib/resources";
import MarkdownContent from "./MarkdownContent";
import "./resources.css";

function ImportSession() {
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
      await publishResourceExamples(user, setResults);
      setDone(true);
    } catch (failure) {
      setError(`${resourceError(failure)} Os itens já adicionados foram preservados; você pode tentar novamente.`);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  if (!authReady) return <main className="catalog-page resource-library"><p role="status" className="py-12 text-center text-muted">Carregando sua conta…</p></main>;
  if (!user) return <main className="catalog-page resource-library"><div className="catalog-empty"><h1>Adicione os exemplos à sua conta.</h1><p>Entre no Mind para publicar os três arquivos Markdown e os dois MCPs com a sua autoria.</p><button type="button" onClick={requestLogin}>Entrar na conta</button></div></main>;
  const publicCount = results.filter(item => item.status === "published").length;
  return <main className="catalog-page resource-library">
    <Link href="/home/resources" className="resource-back"><ArrowLeft size={16}/>Arquivos e MCPs</Link>
    <div className="explore-heading"><div><h1 className="text-2xl font-semibold tracking-tight">Cinco exemplos para a sua conta</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Três arquivos Markdown e dois MCPs, com conteúdo, instruções e links oficiais. Ao confirmar, eles ficam públicos no seu perfil e nos catálogos.</p></div></div>
    <div className="resource-library-list">{resourceExamples.map(example => {
      const result = results.find(item => item.exampleId === example.id);
      const doc = example.document;
      return <article key={example.id}>
        <div className="resource-library-symbol" aria-hidden="true">{example.kind === "markdown" ? <FileCode2 size={24}/> : <Plug size={24}/>}</div>
        <div className="min-w-0 flex-1"><h2 className="font-semibold">{doc.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{doc.summary}</p>{result && <p className="mt-2 flex items-center gap-2 text-sm"><Check size={15}/>{result.created ? "Publicado na sua conta" : result.status === "published" ? "Já estava publicado na sua conta" : "Rascunho existente preservado"}</p>}</div>
        {result && <Link href={result.status === "published" ? `/resources/${result.resourceId}` : `/home/resources/${result.resourceId}/edit`} className="workflow-button secondary">{result.status === "published" ? "Ver publicação" : "Ver rascunho"}</Link>}
        <details className="basis-full rounded-xl bg-surface p-5"><summary className="cursor-pointer text-sm font-medium">Conferir conteúdo e instruções</summary><div className="mt-5 max-w-3xl text-sm leading-7">
          {example.kind === "markdown" ? <MarkdownContent content={doc.content}/> : <><h3 className="font-semibold">Desenvolvedor: {doc.developer}</h3><p className="mt-3">{doc.description}</p><a className="mt-3 inline-block underline underline-offset-4" href={doc.documentation} target="_blank" rel="noopener noreferrer">Documentação oficial</a><pre className="resource-source mt-4 rounded-xl bg-media p-4">{doc.config}</pre><p className="mt-3">Autenticação: {doc.authentication}</p><p className="mt-3">Permissões: {doc.permissions}</p><p className="mt-3">Custo: {doc.pricing}</p></>}
          <h3 className="mt-6 font-semibold">Como usar</h3><p className="mt-2 whitespace-pre-wrap">{doc.instructions}</p><p className="mt-4">Ferramentas: {doc.clients.join(", ")}</p><p className="mt-3">Licença: {doc.license}</p><p className="mt-3 text-muted">{doc.credits}</p>
        </div></details>
      </article>;
    })}</div>
    <div className="mt-8 max-w-3xl" aria-live="polite">{busy && <p role="status" className="mb-4 text-sm text-muted">Publicando exemplos: {results.length} de {resourceExamples.length} concluídos…</p>}{done && <p role="status" className="mb-4 text-sm leading-7">Importação concluída: {publicCount} {publicCount === 1 ? "exemplo público" : "exemplos públicos"} na sua conta.{results.length > publicCount && " Os rascunhos que já existiam foram preservados."}</p>}{error && <p role="alert" className="resource-error">{error}</p>}</div>
    <div className="resource-actions mt-6">{!done && <button type="button" disabled={busy} className="workflow-button" onClick={() => void publish()}>{busy ? <><Loader2 size={16} className="animate-spin motion-reduce:animate-none"/>Publicando…</> : error ? "Tentar novamente" : "Publicar os 5 exemplos na minha conta"}</button>}{done && <Link href="/home/resources" className="workflow-button">Ver meus arquivos e MCPs</Link>}<Link href={`/u/${user.uid}`} className="workflow-button secondary">Ver meu perfil</Link></div>
    <p className="mt-4 text-xs leading-6 text-muted">A importação pode ser retomada. Exemplos já adicionados à conta mantêm o conteúdo e o estado de publicação existentes.</p>
  </main>;
}
export default function ResourceExamplesImport() {
  const { user } = useOnboarding();
  return <ImportSession key={user?.uid ?? "visitor"}/>;
}
