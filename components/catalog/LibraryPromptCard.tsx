"use client";
import { useState } from "react";
import Link from "next/link";
import { Copy, Files, Pencil, Star, Trash2, Check, ImageIcon } from "lucide-react";
import { ActionNode } from "@/components/ui/ActionNode";
import type { Prompt } from "@/lib/firebase/data";

type Props = { prompt: Prompt; creatorId: string; copied: boolean; publishing: boolean; publicationPending: boolean; onEdit: () => void; onCopy: () => void; onFavorite: () => void; onDuplicate: () => void; onPublication: () => void; onDelete: () => void };
export default function LibraryPromptCard({ prompt, creatorId, copied, publishing, publicationPending, onEdit, onCopy, onFavorite, onDuplicate, onPublication, onDelete }: Props) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const cover = prompt.images.find(image => image.role === "gallery" || image.role === "after") ?? prompt.images[0];
  const href = `/home/prompts/${encodeURIComponent(prompt.id)}`;
  return <ActionNode title={prompt.title} description="" className="catalog-library-card" actions={[
    { id: "edit", label: `Editar ${prompt.title}`, icon: Pencil, onClick: onEdit },
    { id: "copy", label: `Copiar ${prompt.title}`, icon: Copy, onClick: onCopy },
    { id: "favorite", label: prompt.isFavorite ? "Remover dos favoritos" : "Favoritar prompt", icon: Star, onClick: onFavorite },
    { id: "duplicate", label: `Duplicar ${prompt.title}`, icon: Files, onClick: onDuplicate },
  ]}>
    <Link href={href} aria-label={`Abrir ${prompt.title}`} className="catalog-card-cover">
      {/* eslint-disable-next-line @next/next/no-img-element -- Existing optimized uploads are data URLs. */}
      {cover && failedCover !== cover.url ? <img src={cover.url} alt={cover.label || prompt.title} loading="lazy" draggable={false} onError={() => setFailedCover(cover.url)} /> : <div className="catalog-text-preview"><ImageIcon size={24} /><p>{prompt.description || prompt.content}</p></div>}
    </Link>
    <div className="p-4">
      <Link href={href} className="block"><h2 className="line-clamp-2 break-words text-base font-semibold leading-6">{prompt.title}</h2></Link>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {prompt.model && <span className="catalog-model-tag">{prompt.model}</span>}
        <span className={`inline-flex items-center gap-1.5 ${prompt.isPublished ? "text-emerald-700" : "text-subtle"}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{prompt.isPublished ? "Público" : "Privado"}</span>
        {prompt.isFavorite && <Star size={13} className="ml-auto fill-amber-500 text-amber-600" aria-label="Favorito" />}
      </div>
      <button type="button" onClick={onCopy} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium hover:bg-surface-hover">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copiado" : "Copiar prompt"}</button>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted">
        <button type="button" disabled={publicationPending} onClick={onPublication} className="min-h-9 rounded-lg px-2 hover:bg-surface-hover disabled:opacity-50">{publishing ? "Salvando…" : prompt.isPublished ? "Tornar privado" : "Publicar prompt"}</button>
        <button type="button" aria-label={`Excluir ${prompt.title}`} onClick={onDelete} className="grid size-9 place-items-center rounded-lg hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /></button>
      </div>
      {prompt.isPublished && <Link href={`/share/${creatorId}/${prompt.id}`} className="mt-1 inline-block py-1 text-xs text-muted underline underline-offset-4">Abrir link público</Link>}
    </div>
  </ActionNode>;
}
