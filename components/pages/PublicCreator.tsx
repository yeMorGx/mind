"use client";
import { useEffect, useState } from "react";
import { resolveUsername } from "@/lib/supabase/creators";
import { creatorProfileHref } from "@/lib/usernames";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPublicCreator, getCreatorPrompts, getSharedPrompt, type CreatorProfile } from "@/lib/firebase/publication";
import type { Prompt } from "@/lib/supabase/types";
import CreatorProfileView from "@/components/pages/CreatorProfileView";
export default function PublicCreator({ creatorId, promptId }: { creatorId: string; promptId?: string }) {
  const [revision, setRevision] = useState(0);
  useEffect(() => { const refresh = () => setRevision(value => value + 1); window.addEventListener("mind:username",refresh); return () => window.removeEventListener("mind:username",refresh); }, []);
  const requestKey = `${creatorId}:${promptId ?? ""}`;
  const [result, setResult] = useState<{ key: string; resolvedId: string; profile: CreatorProfile; prompts: Prompt[]; prompt?: Prompt; promptsError?: boolean } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const resolvedId = creatorId.startsWith("@") ? await resolveUsername(creatorId) : creatorId;
        if (!resolvedId) throw new Error();
        const profile = await getPublicCreator(resolvedId);
        if (!profile) throw new Error();
        const prompt = promptId ? await getSharedPrompt(resolvedId, promptId, profile) : undefined;
        if (promptId && !prompt) throw new Error();
        let promptsError = false;
        const prompts = await getCreatorPrompts(resolvedId, profile).catch(() => { promptsError = true; return []; });
        if (alive) setResult({ key: requestKey, resolvedId, profile, prompts, prompt: prompt ?? undefined, promptsError });
      } catch { if (alive) setError({ key: requestKey, message: promptId ? "Este prompt não está disponível. Ele pode estar privado ou ter sido removido." : "Não foi possível carregar este perfil. Confira o endereço e tente novamente." }); }
    }
    void load(); return () => { alive = false; };
  }, [creatorId, promptId, requestKey, revision]);
  const current = result?.key === requestKey ? result : null;
  if (current?.prompt) return <PublicPromptPage prompt={current.prompt} creatorHref={creatorProfileHref(current.resolvedId,current.profile.username)} creatorProfile={current.profile} creatorPrompts={current.prompts.filter(item=>item.id!==current.prompt?.id).slice(0,3)} />;
  if (current) return <CreatorProfileView profile={current.profile} prompts={current.prompts} creatorId={current.resolvedId} promptsError={current.promptsError} />;
  return <main className="min-h-[calc(100dvh-4.5rem)] bg-background px-5 py-10 text-foreground"><div className="mx-auto mt-14 max-w-5xl">
    <p role="status" className="text-center text-muted">{error?.key === requestKey ? error.message : promptId ? "Carregando prompt…" : "Carregando perfil…"}</p>
  </div></main>;
}
