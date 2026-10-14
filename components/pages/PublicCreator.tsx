"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPublicCreator, getCreatorPrompts, getSharedPrompt, type CreatorProfile } from "@/lib/firebase/publication";
import type { Prompt } from "@/lib/supabase/types";
import CreatorProfileView from "@/components/pages/CreatorProfileView";
export default function PublicCreator({ creatorId, promptId }: { creatorId: string; promptId?: string }) {
  const [result, setResult] = useState<{ profile: CreatorProfile; prompts: Prompt[]; prompt?: Prompt } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const profile = await getPublicCreator(creatorId);
        if (!profile) throw new Error();
        const prompt = promptId ? await getSharedPrompt(creatorId, promptId, profile) : undefined;
        if (promptId && !prompt) throw new Error();
        const prompts = promptId ? [] : await getCreatorPrompts(creatorId, profile);
        if (alive) setResult({ profile, prompts, prompt: prompt ?? undefined });
      } catch { if (alive) setError("Esta publicação não está disponível. Ela pode estar privada ou ter sido removida."); }
    }
    void load(); return () => { alive = false; };
  }, [creatorId, promptId]);
  if (result?.prompt) return <PublicPromptPage prompt={result.prompt} creatorHref={`/u/${creatorId}`} creatorProfile={result.profile} />;
  if (result) return <CreatorProfileView profile={result.profile} prompts={result.prompts} creatorId={creatorId} />;
  return <main className="min-h-screen bg-background px-5 py-10 text-foreground"><header className="flex justify-center"><Link href="/" aria-label="Mind"><Logo /></Link></header><div className="mx-auto mt-14 max-w-5xl">
    <p role="status" className="text-center text-white/60">{error || "Carregando publicação…"}</p>
  </div></main>;
}
