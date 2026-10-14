"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPrompt, type Prompt } from "@/lib/firebase/data";

type PromptState = {
  key: string;
  prompt: Prompt | null;
  error: boolean;
};

export default function LibraryPromptPage({ promptId }: { promptId: string }) {
  const router = useRouter();
  const { user, authReady, profileLoading, data } = useOnboarding();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<PromptState | null>(null);
  const workspaceId = data.primaryWorkspaceId;
  const requestKey = `${user?.uid ?? ""}:${workspaceId}:${promptId}:${attempt}`;

  useEffect(() => {
    if (authReady && !user) router.replace("/");
    if (authReady && user && !profileLoading && !data.onboardingComplete) {
      router.replace("/register/step-2");
    }
  }, [authReady, user, profileLoading, data.onboardingComplete, router]);

  useEffect(() => {
    if (!authReady || !user || profileLoading || !data.onboardingComplete || !workspaceId) return;
    let active = true;
    // Read only from the authenticated user's workspace; existing Firestore rules enforce ownership.
    void getPrompt(workspaceId, promptId).then((prompt) => {
      if (active) setState({ key: requestKey, prompt, error: false });
    }).catch(() => {
      if (active) setState({ key: requestKey, prompt: null, error: true });
    });
    return () => { active = false; };
  }, [authReady, user, profileLoading, data.onboardingComplete, workspaceId, promptId, requestKey]);

  if (!authReady || !user || profileLoading || !data.onboardingComplete || state?.key !== requestKey) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-white/60"><p role="status">Carregando seu prompt…</p></main>;
  }

  if (state.error || !state.prompt) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">{state.error ? "Não conseguimos carregar este prompt" : "Prompt não encontrado"}</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">{state.error ? "Verifique sua conexão e tente novamente." : "Este prompt não está na sua biblioteca ou foi removido."}</p>
        {state.error && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Tentar novamente</button>}
        <Link href="/home" className="mt-6 block text-sm text-white/70 hover:text-white">Voltar à biblioteca</Link>
      </div>
    </main>;
  }

  const prompt = state.prompt;

  return <PublicPromptPage visibility="private" prompt={{
    id: prompt.id,
    slug: prompt.id,
    creatorId: user.uid,
    creatorName: data.name || user.displayName || "Criador Mind",
    creatorSlug: "",
    title: prompt.title,
    content: prompt.content,
    description: prompt.description,
    category: prompt.category,
    model: prompt.model,
    status: "draft",
    isFavorite: prompt.isFavorite,
    createdAt: prompt.createdAt ?? Number.NaN,
    updatedAt: prompt.updatedAt ?? Number.NaN,
    images: prompt.images.map((image, position) => ({ ...image, path: "", position })),
  }} />;
}
