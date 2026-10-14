"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Share2, Sparkles } from "lucide-react";
import { ImageCompare } from "@/components/ui/ImageCompare";
import PromptCard from "@/components/marketplace/PromptCard";
import ResultsMarquee from "@/components/marketplace/ResultsMarquee";
import type { Prompt } from "@/lib/supabase/types";
import type { CreatorProfile } from "@/lib/firebase/publication";
import CreatorLanyard from "@/components/marketplace/CreatorLanyard";
import CreatorBadges from "@/components/ui/CreatorBadges";

/* eslint-disable @next/next/no-img-element -- Supabase returns short-lived signed image URLs. */

export default function PublicPromptPage({ prompt, creatorPrompts = [], relatedPrompts = [], visibility = "public", actions, creatorHref, creatorProfile }: {
  prompt: Prompt;
  creatorPrompts?: Prompt[];
  relatedPrompts?: Prompt[];
  visibility?: "public" | "private";
  actions?: ReactNode;
  creatorHref?: string;
  creatorProfile?: CreatorProfile;
}) {
  const isPrivate = visibility === "private";
  const backHref = isPrivate ? "/home" : "/";
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const displayedImages = useMemo(() => prompt.images.filter((image) => image.role === "gallery" || image.role === "after"), [prompt.images]);
  const before = prompt.images.find((image) => image.role === "before");
  const after = prompt.images.find((image) => image.role === "after");
  const references = prompt.images.filter((image) => image.role === "reference");
  const creatorName = prompt.creatorName || "Criador Mind";
  const formatDate = (timestamp: number) => Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(timestamp)
    : "Não informada";

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setShareMessage("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setShareMessage("Não foi possível copiar automaticamente. Selecione o texto do prompt para copiar.");
    }
  }

  async function sharePage() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: prompt.title, text: `Prompt: ${prompt.title}`, url });
        setShareMessage("Página compartilhada.");
      }
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copiado para compartilhar.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareMessage("Não foi possível copiar o link.");
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <Link href={backHref} className="inline-flex items-center gap-2 rounded-lg py-2 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} />{isPrivate ? "Voltar à biblioteca" : "Explorar prompts"}</Link>
        {!isPrivate && <button type="button" onClick={() => void sharePage()} aria-label="Compartilhar prompt" className="site-icon-button"><Share2 size={18} /></button>}
      </div>

      <article className="mx-auto w-full max-w-6xl space-y-10 px-5 pb-20 pt-6 sm:px-8 lg:pt-10">
        <section className="min-w-0">
          <div className="mt-8 flex flex-wrap gap-2">
            {prompt.category && <span className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-xs text-muted">{prompt.category}</span>}
            {prompt.model && <span className="rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-xs text-muted">{prompt.model}</span>}
          </div>
          <h1 className="mt-5 break-words text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{prompt.title}</h1>
          {prompt.description && <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-muted">{prompt.description}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-subtle">
            <a href="#creator" className="hover:text-foreground">por <strong className="font-medium text-muted">{creatorName}</strong></a>
            <span aria-hidden="true">·</span>
            <span>{isPrivate ? "Privado · sua biblioteca" : "Grátis para experimentar"}</span>
          </div>

          {actions}
          {displayedImages.length > 0 ? (
            <ResultsMarquee images={displayedImages} />
          ) : (
            <div className="mt-9 flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-subtle">Nenhuma imagem adicionada a este prompt.</div>
          )}

          <div className="mt-8 rounded-2xl border border-border bg-foreground/[0.025] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.17em] text-subtle">Prompt completo</p>
                <p className="mt-2 text-sm text-muted">Copie e experimente na sua ferramenta.</p>
              </div>
              <button type="button" onClick={() => void copyPrompt()} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover">
                {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copiado" : "Copiar prompt"}
              </button>
            </div>
            <pre className="mt-6 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-surface p-4 font-mono text-sm leading-6 text-muted">{prompt.content}</pre>
            {shareMessage && <p role="status" className="mt-3 text-sm text-muted">{shareMessage}</p>}
            <p role="status" className="sr-only">{copied ? "Prompt copiado para a área de transferência." : ""}</p>
            {!isPrivate && <button type="button" onClick={() => void sharePage()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"><ExternalLink size={15} /> Compartilhar esta página</button>}
            <p className="mt-4 text-center text-xs leading-5 text-subtle">{isPrivate ? "Este prompt pertence à sua biblioteca. O acesso exige sua conta." : "Sem pagamento e sem cadastro para visualizar ou copiar."}</p>
          </div>


          {references.length > 0 && <section className="mt-8">
            <h2 className="mb-3 text-lg font-medium">{references.length === 1 ? "Imagem de referência" : "Imagens de referência"}</h2>
            <p className="mb-4 text-sm leading-6 text-subtle">Referências compartilhadas pelo criador para reproduzir o resultado.</p>
            <div className="grid gap-4">
              {references.map((reference) => <figure key={reference.id}>
                <img src={reference.url} alt={reference.label || "Referência usada na publicação"} loading="lazy" className="max-h-[480px] w-full rounded-2xl border border-border bg-foreground/[0.03] object-contain" />
                {reference.label && <figcaption className="mt-2 text-sm text-muted">{reference.label}</figcaption>}
              </figure>)}
            </div>
          </section>}

          {before && after && <section className="mt-10">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.18em] text-subtle">O efeito do prompt</p>
              <h2 className="mt-2 text-2xl font-medium">Antes e depois</h2>
              <p className="mt-2 text-sm leading-6 text-subtle">Arraste a divisória para comparar a referência com o resultado.</p>
            </div>
            <ImageCompare beforeSrc={before.url} afterSrc={after.url} beforeAlt={before.label || "Antes"} afterAlt={after.label || "Depois"} aspectRatio={4 / 3} />
          </section>}
          {before && !after && <section className="mt-8">
            <h2 className="mb-3 text-lg font-medium">Imagem original</h2>
            <img src={before.url} alt={before.label || "Imagem antes de aplicar o prompt"} loading="lazy" className="max-h-[480px] w-full rounded-2xl border border-border object-contain" />
            {before.label && <p className="mt-2 text-sm text-muted">{before.label}</p>}
          </section>}
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-3">
          <section id="creator" aria-labelledby="creator-heading" className="scroll-mt-24 rounded-2xl border border-border p-5 sm:p-7">
            <h2 id="creator-heading" className="text-lg font-medium">Conheça o criador</h2>
            {creatorProfile && creatorHref ? <CreatorLanyard profile={creatorProfile} href={creatorHref} /> : <div className="mt-5 flex items-center gap-4">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground/[0.08] text-xl font-semibold">{Array.from(creatorName.trim())[0]?.toUpperCase() || "M"}</span>
              <div className="min-w-0">
                <p className="break-words text-lg font-medium">{creatorName}</p>
                <CreatorBadges badges={creatorProfile?.badges} />
                {creatorHref && <Link href={creatorHref} className="mt-1 block text-sm text-muted underline">Ver perfil público</Link>}
                {prompt.creatorSlug && <p className="mt-1 break-words text-sm text-subtle">@{prompt.creatorSlug}</p>}
              </div>
            </div>}
            <p className="mt-4 text-sm leading-6 text-muted">{isPrivate ? "Autor deste prompt na sua biblioteca." : "Compartilhou este prompt e seus exemplos de resultado com a comunidade Mind."}</p>
            {creatorPrompts.length > 0 && <a href="#creator-prompts" className="mt-4 inline-flex items-center gap-2 text-sm text-foreground hover:text-foreground">Mais prompts deste criador <ArrowRight size={15} /></a>}
          </section>

          <section aria-labelledby="details-heading" className="rounded-2xl border border-border p-5 sm:p-7">
            <h2 id="details-heading" className="text-lg font-medium">Sobre este prompt</h2>
            <dl className="mt-5 space-y-4 text-sm">
              {[
                ["Ferramenta / modelo", prompt.model || "Não informado"],
                ["Categoria", prompt.category || "Não informada"],
                ["Acesso", isPrivate ? "Privado" : "Gratuito"],
                ["Criado em", formatDate(prompt.createdAt)],
                ...(prompt.updatedAt > prompt.createdAt ? [["Atualizado em", formatDate(prompt.updatedAt)]] : []),
              ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5"><dt className="text-subtle">{label}</dt><dd className="max-w-[60%] break-words text-right text-muted">{value}</dd></div>)}
            </dl>
          </section>

          <section aria-labelledby="how-to-heading" className="rounded-2xl border border-border p-5 sm:p-7">
            <h2 id="how-to-heading" className="flex items-center gap-2 text-lg font-medium"><Sparkles size={18} className="text-muted" /> Como usar</h2>
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-muted marker:text-subtle">
              <li>Copie o texto completo do prompt.</li>
              <li>Abra {prompt.model || "a ferramenta de IA de sua preferência"} e cole o texto.{references.length > 0 || before ? " Adicione a imagem de referência, se a ferramenta permitir." : ""}</li>
              <li>Adapte os detalhes ao seu objetivo e gere o resultado.</li>
            </ol>
            <p className="mt-4 text-xs leading-5 text-subtle">Os resultados podem variar conforme o modelo, a versão e as configurações da ferramenta.</p>
          </section>
        </div>
      </article>

      {(creatorPrompts.length > 0 || relatedPrompts.length > 0) && <div className="mx-auto max-w-7xl space-y-14 px-5 pb-20 sm:px-8">
        {creatorPrompts.length > 0 && <section id="creator-prompts" className="scroll-mt-24 border-t border-border pt-10">
          <p className="text-xs uppercase tracking-[0.17em] text-subtle">Continue explorando</p>
          <h2 className="mt-3 text-2xl font-medium">Mais de {creatorName}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{creatorPrompts.map((item) => <PromptCard key={item.id} prompt={item} />)}</div>
        </section>}
        {relatedPrompts.length > 0 && <section className="border-t border-border pt-10">
          <h2 className="text-2xl font-medium">Explore outros prompts de {prompt.category}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relatedPrompts.map((item) => <PromptCard key={item.id} prompt={item} />)}</div>
        </section>}
      </div>}
    </main>
  );
}
