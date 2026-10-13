"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPrompt, createPrompt, setPromptFavorite, updatePrompt, type Prompt } from "@/lib/firebase/data";
import { Copy, Files, Pencil, Star } from "lucide-react";
import { ActionNode } from "@/components/ui/ActionNode";
import PromptDialog from "@/components/prompts/PromptDialog";
import type { PromptDetails } from "@/lib/prompt-media";

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [notice, setNotice] = useState("");
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

  async function perform(action: () => Promise<unknown>, success: string) {
    if (actionPending) return;
    setActionPending(true);
    setNotice("");
    try { await action(); setNotice(success); }
    catch { setNotice("Não foi possível concluir esta ação. Tente novamente."); }
    finally { setActionPending(false); }
  }

  async function save(title: string, content: string, details: PromptDetails) {
    setSaving(true);
    setSaveError("");
    try {
      await updatePrompt(workspaceId, prompt.id, title, content, details);
      setEditing(false);
      setAttempt((value) => value + 1);
    } catch (failure) { setSaveError(failure instanceof Error ? failure.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  return <><PublicPromptPage visibility="private" actions={<>
    <ActionNode title="Ações do prompt" description="Edite, copie, favorite ou duplique. Toque no + para ver as ações." disabled={actionPending || saving}
      actions={[
        { id: "edit", label: "Editar prompt", icon: Pencil, onClick: () => { setSaveError(""); setEditing(true); } },
        { id: "copy", label: "Copiar prompt", icon: Copy, onClick: () => void perform(() => navigator.clipboard.writeText(prompt.content), "Prompt copiado.") },
        { id: "favorite", label: prompt.isFavorite ? "Remover dos favoritos" : "Favoritar prompt", icon: Star, onClick: () => void perform(async () => { await setPromptFavorite(workspaceId, prompt.id, !prompt.isFavorite); setAttempt((value) => value + 1); }, prompt.isFavorite ? "Favorito removido." : "Prompt favoritado.") },
        { id: "duplicate", label: "Duplicar prompt", icon: Files, onClick: () => void perform(async () => { if (!user) return; const id = await createPrompt(workspaceId, user.uid, `${prompt.title.slice(0, 110)} (cópia)`, prompt.content, { description: prompt.description, category: prompt.category, model: prompt.model, images: prompt.images }); router.push(`/home/prompts/${id}`); }, "Cópia criada.") },
      ]} />
    {notice && <p role="status" className="mt-2 text-sm text-white/60">{notice}</p>}
  </>} prompt={{
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
  }} />
    <PromptDialog key={`${prompt.id}:${attempt}`} isOpen={editing} prompt={prompt} pending={saving} error={saveError} onClose={() => setEditing(false)} onSave={(title, content, details) => void save(title, content, details)} />
  </>;
}
