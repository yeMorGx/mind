import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Prompt } from "@/lib/supabase/types";

/* eslint-disable @next/next/no-img-element -- Supabase returns short-lived signed image URLs. */

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const cover = prompt.images.find((image) => image.role === "gallery")
    ?? prompt.images.find((image) => image.role === "after")
    ?? prompt.images[0];
  const resultCount = prompt.images.filter((image) => image.role === "gallery" || image.role === "after").length;

  return (
    <Link href={`/p/${prompt.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-foreground/[0.025] transition hover:-translate-y-1 hover:border-border hover:bg-foreground/[0.04]">
      <div className="relative aspect-[4/3] overflow-hidden bg-foreground/[0.035]">
        {cover ? (
          <img src={cover.url} alt={cover.label || prompt.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-subtle">Exemplos de resultado em breve</div>
        )}
        {prompt.category && <span className="absolute left-3 top-3 rounded-full border border-border bg-black/65 px-3 py-1 text-[11px] text-white backdrop-blur">{prompt.category}</span>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-medium leading-6 text-foreground">{prompt.title}</h3>
          <ArrowUpRight size={17} className="mt-1 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-subtle">{prompt.description || prompt.content}</p>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-subtle">
          <span className="truncate pr-3">por {prompt.creatorName || "Criador Mind"}</span>
          <span className="shrink-0">{resultCount} {resultCount === 1 ? "imagem" : "imagens"}</span>
        </div>
      </div>
    </Link>
  );
}
