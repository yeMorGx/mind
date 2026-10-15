"use client";
import PromptCover from "@/components/prompts/PromptCover";
import AIModelLogo from "@/components/models/AIModelLogo";
import Link from "next/link";
import { Copy, Files, Pencil, Star, Trash2 } from "lucide-react";
import { ActionNode } from "@/components/ui/ActionNode";
import type { Prompt } from "@/lib/firebase/data";

type Props = { prompt: Prompt;  onEdit: () => void; onCopy: () => void; onFavorite: () => void; onDuplicate: () => void; onDelete: () => void };
export default function LibraryPromptCard({ prompt, onEdit, onCopy, onFavorite, onDuplicate, onDelete }: Props) {
  const href = `/home/prompts/${encodeURIComponent(prompt.id)}`;
  return <ActionNode title={prompt.title} description="" className="catalog-library-card" actions={[
    { id: "edit", label: `Editar ${prompt.title}`, icon: Pencil, onClick: onEdit },
    { id: "copy", label: `Copiar ${prompt.title}`, icon: Copy, onClick: onCopy },
    { id: "favorite", label: prompt.isFavorite ? "Remover dos favoritos" : "Favoritar prompt", icon: Star, onClick: onFavorite },
    { id: "duplicate", label: `Duplicar ${prompt.title}`, icon: Files, onClick: onDuplicate },
  ]}>
    <Link href={href} aria-label={`Abrir ${prompt.title}`} className="catalog-card-cover">
      <PromptCover prompt={prompt}/>
    </Link>
    <div className="p-4">
      <Link href={href} className="block"><h2 className="line-clamp-2 break-words text-base font-semibold leading-6">{prompt.title}</h2></Link>
{(prompt.summary||prompt.description)&&<p className="prompt-card-summary">{prompt.summary||prompt.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {prompt.model && <AIModelLogo value={prompt.model}/>}
        <span className={`inline-flex items-center gap-1.5 ${prompt.isPublished ? "text-emerald-700" : "text-subtle"}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{prompt.isPublished ? "Público" : "Privado"}</span>
        {prompt.isFavorite && <Star size={13} className="ml-auto fill-amber-500 text-amber-600" aria-label="Favorito" />}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted">
        <Link href={`/home/prompts/${encodeURIComponent(prompt.id)}/publish`} className="inline-flex min-h-11 items-center rounded-lg px-2 hover:bg-surface-hover">{prompt.isPublished?"Gerenciar publicação":"Revisar e publicar"}</Link>
        <button type="button" aria-label={`Excluir ${prompt.title}`} onClick={onDelete} className="grid size-9 place-items-center rounded-lg hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /></button>
      </div>
    </div>
  </ActionNode>;
}
