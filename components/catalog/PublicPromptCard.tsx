"use client";
import Link from "next/link";
import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { creatorProfileHref } from "@/lib/usernames";
import type { Prompt } from "@/lib/supabase/types";
export default function PublicPromptCard({ prompt }: { prompt: Prompt }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const creatorName = prompt.creatorName || "Criador Mind";
  const cover = prompt.images.find(image => image.role === "gallery" || image.role === "after") ?? prompt.images[0];
  async function copy() {
    try { await navigator.clipboard.writeText(prompt.content); setCopied(true); setError(""); window.setTimeout(() => setCopied(false), 1800); }
    catch { setError("Não foi possível copiar. Abra o prompt para selecionar o texto."); }
  }
  return <article className="catalog-public-card">
    <Link href={`/p/${prompt.slug}`} aria-label={`Abrir ${prompt.title}`} className="catalog-card-cover">
      {/* eslint-disable-next-line @next/next/no-img-element -- Real published images, including optimized data URLs. */}
      {cover && failedCover !== cover.url ? <img src={cover.url} alt={cover.label || prompt.title} loading="lazy" draggable={false} onError={() => setFailedCover(cover.url)} /> : <div className="catalog-text-preview"><Sparkles size={24} /><p>{prompt.description || prompt.content}</p></div>}
    </Link>
    <div className="p-4">
      <Link href={`/p/${prompt.slug}`}><h2 className="line-clamp-2 break-words text-base font-semibold leading-6">{prompt.title}</h2></Link>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link href={creatorProfileHref(prompt.creatorId,prompt.creatorSlug)} title={prompt.creatorSlug ? `${creatorName} · @${prompt.creatorSlug}` : creatorName} className="inline-flex min-h-10 min-w-0 max-w-full items-center gap-2 text-sm text-muted hover:text-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element -- Public profile images include optimized data URLs. */}
          {prompt.creatorAvatarUrl && failedAvatar !== prompt.creatorAvatarUrl ? <img src={prompt.creatorAvatarUrl} alt="" loading="lazy" className="size-7 shrink-0 rounded-full object-cover" onError={() => setFailedAvatar(prompt.creatorAvatarUrl ?? "")} /> : <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-media text-xs font-medium text-foreground">{Array.from(creatorName.trim())[0]?.toUpperCase() || "M"}</span>}
          <span className="truncate font-medium">{creatorName}</span>
        </Link>
        {prompt.model && <span className="catalog-model-tag">{prompt.model}</span>}
      </div>
      <button type="button" onClick={() => void copy()} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium hover:bg-surface-hover">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copiado" : "Copiar prompt"}</button>
      {error && <p role="status" className="mt-2 text-xs leading-5 text-red-700">{error}</p>}
    </div>
  </article>;
}
