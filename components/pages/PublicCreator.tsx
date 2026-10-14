"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPublicCreator, getCreatorPrompts, getSharedPrompt, type CreatorProfile } from "@/lib/firebase/publication";
import type { Prompt } from "@/lib/supabase/types";
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
  if (result?.prompt) return <PublicPromptPage prompt={result.prompt} creatorHref={`/u/${creatorId}`} />;
  return <main className="min-h-screen bg-background px-5 py-10 text-foreground"><header className="flex justify-center"><Link href="/" aria-label="Mind"><Logo /></Link></header><div className="mx-auto mt-14 max-w-5xl">
    {result ? <><h1 className="text-4xl font-semibold">{result.profile.name}</h1><p className="mt-5 max-w-2xl whitespace-pre-wrap text-white/60">{result.profile.bio}</p>
      <h2 className="mt-12 text-xl">Prompts publicados</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.prompts.map(prompt => <Link key={prompt.id} href={`/share/${creatorId}/${prompt.id}`} className="rounded-2xl border border-white/10 p-5 hover:bg-white/5"><h3 className="font-medium">{prompt.title}</h3><p className="mt-3 line-clamp-3 text-sm text-white/50">{prompt.description || prompt.content}</p></Link>)}</div>{!result.prompts.length && <p className="mt-6 text-white/50">Este criador ainda não publicou prompts.</p>}</> : <p role="status" className="text-center text-white/60">{error || "Carregando publicação…"}</p>}
  </div></main>;
}
