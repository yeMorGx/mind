"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useState } from "react";
import { HoverCard } from "radix-ui";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import CreatorIdentity from "./CreatorIdentity";
import { FollowControls } from "@/components/social/SocialControls";
import { getPublicCreator, type CreatorProfile } from "@/lib/firebase/publication";
import { creatorProfileHref } from "@/lib/usernames";
import type { Prompt } from "@/lib/supabase/types";

const cache = new Map<string, { at: number; profile: Promise<CreatorProfile | null> }>();
function loadProfile(id: string) {
  const existing = cache.get(id);
  if (existing && Date.now() - existing.at < 60_000) return existing.profile;
  const profile = getPublicCreator(id).catch(error => { cache.delete(id); throw error; });
  cache.set(id, { at: Date.now(), profile });
  return profile;
}
export default function CreatorPreview({ prompt }: { prompt: Prompt }) {
 const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ profile: CreatorProfile | null } | null>(null);
  const href = creatorProfileHref(prompt.creatorId, prompt.creatorSlug);
  const identity = { name: prompt.creatorName || "Criador Mind", avatarUrl: prompt.creatorAvatarUrl, badges: prompt.creatorBadges, username: prompt.creatorSlug, href };
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void loadProfile(prompt.creatorId).then(profile => { if (alive) setResult({ profile }); }).catch(() => { if (alive) setResult({ profile: null }); });
    return () => { alive = false; };
  }, [open, prompt.creatorId]);
  return <HoverCard.Root open={open} openDelay={350} closeDelay={150} onOpenChange={next => setOpen(next && window.matchMedia("(hover: hover)").matches)}>
    <HoverCard.Trigger asChild><CreatorIdentity {...identity} username={undefined}/></HoverCard.Trigger>
    <HoverCard.Portal><HoverCard.Content className="creator-preview" side="top" sideOffset={12} collisionPadding={16}>
      <CreatorIdentity {...identity} name={result?.profile?.name || identity.name} avatarUrl={result?.profile?.avatarUrl || identity.avatarUrl} badges={result?.profile?.badges ?? identity.badges}/>
      {!result ? <div className="creator-preview-loading" aria-label={t("Carregando apresentação")}><span className="image-skeleton"/><span className="image-skeleton"/></div> : <p>{result.profile?.headline || result.profile?.bio || t("Conheça os prompts e resultados deste criador.")}</p>}
      <FollowControls creatorId={prompt.creatorId}/>
      <Link href={href} className="creator-preview-link">{t("Ver perfil completo")}{" "}<ArrowUpRight size={15}/></Link>
    </HoverCard.Content></HoverCard.Portal>
  </HoverCard.Root>;
}
