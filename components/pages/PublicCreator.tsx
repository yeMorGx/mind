"use client";
import { useEffect, useState } from "react";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPublicCreator, getCreatorPrompts, getSharedPrompt, type CreatorProfile } from "@/lib/firebase/publication";
import type { Prompt } from "@/lib/supabase/types";
import CreatorProfileView from "@/components/pages/CreatorProfileView";
export default function PublicCreator({ creatorId, promptId }: { creatorId: string; promptId?: string }) {
  const requestKey = `${creatorId}:${promptId ?? ""}`;
  const [result, setResult] = useState<{ key: string; profile: CreatorProfile; prompts: Prompt[]; prompt?: Prompt; promptsError?: boolean } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const profile = await getPublicCreator(creatorId);
        if (!profile) throw new Error();
        const prompt = promptId ? await getSharedPrompt(creatorId, promptId, profile) : undefined;
        if (promptId && !prompt) throw new Error();
        let promptsError = false;
        const prompts = promptId ? [] : await getCreatorPrompts(creatorId, profile).catch(() => { promptsError = true; return []; });
        if (alive) setResult({ key: requestKey, profile, prompts, prompt: prompt ?? undefined, promptsError });
      } catch { if (alive) setError({ key: requestKey, message: promptId ? "Este prompt não está disponível. Ele pode estar privado ou ter sido removido." : "Não foi possível carregar este perfil. Confira o endereço e tente novamente." }); }
    }
    void load(); return () => { alive = false; };
  }, [creatorId, promptId, requestKey]);
  const current = result?.key === requestKey ? result : null;
  if (current?.prompt) return <PublicPromptPage prompt={current.prompt} creatorHref={`/u/${creatorId}`} creatorProfile={current.profile} />;
  if (current) return <CreatorProfileView profile={current.profile} prompts={current.prompts} creatorId={creatorId} promptsError={current.promptsError} />;
  return <main className="min-h-[calc(100dvh-4rem)] bg-background px-5 py-10 text-foreground"><div className="mx-auto mt-14 max-w-5xl">
    <p role="status" className="text-center text-muted">{error?.key === requestKey ? error.message : promptId ? "Carregando prompt…" : "Carregando perfil…"}</p>
  </div></main>;
}
