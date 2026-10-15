"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import PromptDialog from "@/components/prompts/PromptDialog";
import type { PromptDetails } from "@/lib/prompt-media";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPrompt, updatePrompt, type Prompt } from "@/lib/firebase/data";
import { getOwnProfile, type CreatorProfile } from "@/lib/firebase/publication";

type PromptState = {
  key: string;
  prompt: Prompt | null;
  error: boolean;
  profile?: CreatorProfile | null;
};

export default function LibraryPromptPage({ promptId, startEditing = false }: { promptId: string; startEditing?: boolean }) {
  const router = useRouter();
  const { user, authReady, profileLoading, data } = useOnboarding();
  const [editing,setEditing]=useState(startEditing);
  const [pending,setPending]=useState(false);
  const [saveError,setSaveError]=useState("");
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
    void Promise.all([getPrompt(workspaceId, promptId), getOwnProfile(user.uid).catch(() => null)]).then(([prompt, profile]) => {
      if (active) setState({ key: requestKey, prompt, profile, error: false });
    }).catch(() => {
      if (active) setState({ key: requestKey, prompt: null, error: true });
    });
    return () => { active = false; };
  }, [authReady, user, profileLoading, data.onboardingComplete, workspaceId, promptId, requestKey]);

  if (!authReady || !user || profileLoading || !data.onboardingComplete || state?.key !== requestKey) {
    return <main className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-background text-muted"><p role="status">Carregando seu prompt…</p></main>;
  }

  if (state.error || !state.prompt) {
    return <main className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">{state.error ? "Não conseguimos carregar este prompt" : "Prompt não encontrado"}</h1>
        <p className="mt-4 text-sm leading-6 text-muted">{state.error ? "Verifique sua conexão e tente novamente." : "Este prompt não está na sua biblioteca ou foi removido."}</p>
        {state.error && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Tentar novamente</button>}
        <Link href="/home" className="mt-6 block text-sm text-muted hover:text-foreground">Voltar à biblioteca</Link>
      </div>
    </main>;
  }

  const prompt = state.prompt;

  async function save(title:string,content:string,details:PromptDetails){
    if(!workspaceId||pending)return;
    setPending(true);setSaveError("");
    try { await updatePrompt(workspaceId,promptId,title,content,details);setEditing(false);setAttempt(value=>value+1); }
    catch {setSaveError("Não foi possível salvar as alterações. Tente novamente.");}
    finally {setPending(false);}
  }
  const profile = state.profile ?? { name: data.name || user.displayName || "Criador Mind", bio: "", avatarUrl: user.photoURL || "" };
  return <><PublicPromptPage actions={<div className="workflow-actions"><button type="button" className="workflow-button secondary" onClick={()=>setEditing(true)}>Editar prompt</button><Link className="workflow-button" href={`/home/prompts/${encodeURIComponent(promptId)}/publish`}>{prompt.isPublished?"Gerenciar publicação":"Revisar e publicar"}</Link></div>} visibility="private" creatorProfile={profile} creatorHref={`/u/${user.uid}`} prompt={{
    kind:prompt.kind,summary:prompt.summary,videoUrl:prompt.videoUrl,videoPath:prompt.videoPath,siteUrl:prompt.siteUrl,
    id: prompt.id,
    slug: prompt.id,
    creatorId: user.uid,
    creatorName: profile.name,
    creatorSlug: "",
    title: prompt.title,
    content: prompt.content,
    description: prompt.description,
    category: prompt.category,
    model: prompt.model,
    status: prompt.isPublished?"published":"draft",
    isFavorite: prompt.isFavorite,
    createdAt: prompt.createdAt ?? Number.NaN,
    updatedAt: prompt.updatedAt ?? Number.NaN,
    images: prompt.images.map((image, position) => ({ ...image, path: "", position })),
  }} /><PromptDialog key={`${promptId}:${attempt}`} isOpen={editing} prompt={prompt} pending={pending} error={saveError} onClose={()=>setEditing(false)} onSave={(title,content,details)=>void save(title,content,details)}/></>;
}
