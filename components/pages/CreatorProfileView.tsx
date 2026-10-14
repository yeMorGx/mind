"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Copy, Check, ImageIcon } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import CreatorProfileEditor from "./CreatorProfileEditor";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type { CreatorProfile } from "@/lib/firebase/publication";
import type { Prompt } from "@/lib/supabase/types";

/* eslint-disable @next/next/no-img-element -- Optimized profile and prompt uploads are data URLs. */
export default function CreatorProfileView({ profile: initialProfile, prompts, creatorId, promptsError = false }: { profile: CreatorProfile; prompts: Prompt[]; creatorId: string; promptsError?: boolean }) {
  const { user } = useOnboarding();
  const owner = user?.uid === creatorId;
  const [editing, setEditing] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState<CreatorProfile | null>(null);
  const profile = updatedProfile ?? initialProfile;
  function editProfile() { setEditing(true); window.setTimeout(() => { document.getElementById("edit-profile-heading")?.focus(); document.getElementById("editar-perfil")?.scrollIntoView({ behavior: "instant", block: "start" }); }, 0); }
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  function closeEditor() { setEditing(false); window.setTimeout(() => document.getElementById("edit-profile-button")?.focus(), 0); }
  async function share() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/u/${creatorId}`); setCopied(true); setNotice("Link do perfil copiado."); window.setTimeout(() => setCopied(false), 2000); }
    catch { setNotice("Não foi possível copiar o link. Copie o endereço na barra do navegador."); }
  }
  return <main className="min-h-[calc(100dvh-4.5rem)] bg-background text-foreground selection:bg-[#dce7ff]">
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8">
      <div className="h-44 overflow-hidden rounded-2xl bg-media sm:h-60 lg:h-72">
        {profile.bannerUrl && <img src={profile.bannerUrl} alt="Capa do perfil" className="size-full object-cover" />}
      </div>
      <section className="relative px-1 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
            <div className="-mt-14 grid size-28 shrink-0 place-items-center overflow-hidden rounded-[28px] border-[6px] border-background bg-media text-4xl font-medium sm:-mt-20 sm:size-44 sm:rounded-[36px]">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`Foto de ${profile.name}`} className="size-full object-cover" /> : <span>{Array.from(profile.name)[0]?.toUpperCase() || "M"}</span>}
            </div>
            <div className="min-w-0 pb-1 sm:pt-6">
              <div className="flex flex-wrap items-center gap-3"><h1 className="min-w-0 max-w-full [overflow-wrap:anywhere] text-3xl font-semibold tracking-tight sm:text-4xl">{profile.name}</h1><CreatorBadges badges={profile.badges} /></div>
              {profile.headline && <p className="mt-2 text-sm font-medium text-muted">{profile.headline}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">{owner && <button id="edit-profile-button" type="button" aria-expanded={editing} aria-controls="editar-perfil" onClick={editProfile} className="rounded-full border border-foreground/25 px-5 py-3 text-sm font-medium hover:bg-black/5">Editar perfil</button>}<button type="button" onClick={() => void share()} className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Link copiado" : "Compartilhar perfil"}</button></div>
        </div>
        {profile.bio && <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted sm:text-base">{profile.bio}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-muted">{notice}</p>}
      </section>
      {owner && editing && <CreatorProfileEditor onClose={closeEditor} onSaved={value => { setUpdatedProfile({ ...profile, ...value }); closeEditor(); setNotice("Perfil atualizado."); }} />}
      <section className="mt-10">
        <div className="flex items-center gap-2 border-b border-border pb-4"><h2 className="text-sm font-semibold">Prompts publicados</h2>{!promptsError && <span className="rounded-full bg-media px-2 py-0.5 text-xs text-subtle">{prompts.length}</span>}</div>
        {promptsError ? <div className="py-16 text-center"><p className="text-sm text-subtle">Não foi possível carregar os prompts deste criador.</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-border px-4 py-2 text-sm">Tentar novamente</button></div> : prompts.length > 0 ? <div className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">{prompts.map(prompt => {
          const image = prompt.images.find(image => image.role === "gallery" || image.role === "after");
          return <Link key={prompt.id} href={`/share/${creatorId}/${prompt.id}`} className="group min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-media">
              {image ? <img src={image.url} alt={image.label || prompt.title} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" /> : <div className="flex size-full flex-col items-center justify-center gap-4 p-6"><ImageIcon size={28} className="text-subtle" /><p className="line-clamp-3 text-center text-sm leading-6 text-muted">{prompt.description || prompt.content}</p></div>}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3"><h3 className="truncate text-sm font-semibold">{prompt.title}</h3><ArrowUpRight size={16} className="shrink-0 text-subtle" /></div>
            <p className="mt-1 text-xs text-subtle">{[prompt.category, prompt.model].filter(Boolean).join(" · ") || "Prompt de IA"}</p>
          </Link>;
        })}</div> : <div className="py-20 text-center"><h3 className="text-lg font-medium">Os próximos prompts vêm aí.</h3><p className="mt-2 text-sm text-subtle">{owner ? "Publique os prompts da sua biblioteca para mostrá-los aqui." : "Este criador ainda não publicou prompts."}</p>{owner && <Link href="/home" className="mt-5 inline-block rounded-full border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5">Ir à biblioteca</Link>}</div>}
      </section>
    </div>
  </main>;
}
