"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Copy, Check, ImageIcon } from "lucide-react";
import Logo from "@/components/ui/logo";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type { CreatorProfile } from "@/lib/firebase/publication";
import type { Prompt } from "@/lib/supabase/types";

/* eslint-disable @next/next/no-img-element -- Optimized profile and prompt uploads are data URLs. */
export default function CreatorProfileView({ profile, prompts, creatorId }: { profile: CreatorProfile; prompts: Prompt[]; creatorId: string }) {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  async function share() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/u/${creatorId}`); setCopied(true); setNotice("Link do perfil copiado."); window.setTimeout(() => setCopied(false), 2000); }
    catch { setNotice("Não foi possível copiar o link. Copie o endereço na barra do navegador."); }
  }
  return <main className="min-h-screen bg-[#fafafa] text-[#17181a] selection:bg-[#dce7ff]">
    <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link href="/" aria-label="Mind — início" className="flex items-center gap-2 [&_svg]:size-16 [&_path]:fill-[#17181a]"><Logo /></Link>
      <Link href="/home/profile" className="rounded-full border border-[#17181a]/15 px-4 py-2 text-sm font-medium hover:bg-[#17181a]/5">Meu perfil</Link>
    </header>
    <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
      <div className="h-44 overflow-hidden rounded-2xl bg-[#e9e7f3] sm:h-60 lg:h-72">
        {profile.bannerUrl && <img src={profile.bannerUrl} alt="Capa do perfil" className="size-full object-cover" />}
      </div>
      <section className="relative px-1 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
            <div className="-mt-14 grid size-28 shrink-0 place-items-center overflow-hidden rounded-[28px] border-[6px] border-[#fafafa] bg-[#ddd9ed] text-4xl font-medium sm:-mt-20 sm:size-44 sm:rounded-[36px]">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`Foto de ${profile.name}`} className="size-full object-cover" /> : <span>{Array.from(profile.name)[0]?.toUpperCase() || "M"}</span>}
            </div>
            <div className="min-w-0 pb-1 sm:pt-6">
              <div className="flex flex-wrap items-center gap-3"><h1 className="min-w-0 max-w-full [overflow-wrap:anywhere] text-3xl font-semibold tracking-tight sm:text-4xl">{profile.name}</h1><CreatorBadges badges={profile.badges} /></div>
              {profile.headline && <p className="mt-2 text-sm font-medium text-[#4d4d57]">{profile.headline}</p>}
            </div>
          </div>
          <button type="button" onClick={() => void share()} className="inline-flex w-fit items-center gap-2 rounded-full bg-[#17181a] px-5 py-3 text-sm font-medium text-white hover:bg-[#34343d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17181a]">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Link copiado" : "Compartilhar perfil"}</button>
        </div>
        {profile.bio && <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#50505a] sm:text-base">{profile.bio}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-[#50505a]">{notice}</p>}
      </section>
      <section className="mt-10">
        <div className="flex items-center gap-2 border-b border-[#17181a]/10 pb-4"><h2 className="text-sm font-semibold">Prompts publicados</h2><span className="rounded-full bg-[#ececf1] px-2 py-0.5 text-xs text-[#53535e]">{prompts.length}</span></div>
        {prompts.length > 0 ? <div className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">{prompts.map(prompt => {
          const image = prompt.images.find(image => image.role === "gallery" || image.role === "after");
          return <Link key={prompt.id} href={`/share/${creatorId}/${prompt.id}`} className="group min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17181a]">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#ebebf0]">
              {image ? <img src={image.url} alt={image.label || prompt.title} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" /> : <div className="flex size-full flex-col items-center justify-center gap-4 p-6"><ImageIcon size={28} className="text-[#747480]" /><p className="line-clamp-3 text-center text-sm leading-6 text-[#555561]">{prompt.description || prompt.content}</p></div>}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3"><h3 className="truncate text-sm font-semibold">{prompt.title}</h3><ArrowUpRight size={16} className="shrink-0 text-[#747480]" /></div>
            <p className="mt-1 text-xs text-[#62626d]">{[prompt.category, prompt.model].filter(Boolean).join(" · ") || "Prompt de IA"}</p>
          </Link>;
        })}</div> : <div className="py-20 text-center"><h3 className="text-lg font-medium">Os próximos prompts vêm aí.</h3><p className="mt-2 text-sm text-[#62626d]">Este criador ainda não publicou prompts.</p></div>}
      </section>
    </div>
  </main>;
}
