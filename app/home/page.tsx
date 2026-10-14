"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Files, Pencil, Star, Trash2 } from "lucide-react";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { ActionNode } from "@/components/ui/ActionNode";
import PromptDialog from "@/components/prompts/PromptDialog";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { setPromptPublication } from "@/lib/firebase/publication";
import type { PromptDetails } from "@/lib/prompt-media";
import {
  createPrompt,
  removePrompt,
  setPromptFavorite,
  subscribeToPrompts,
  updatePrompt,
  type Prompt,
} from "@/lib/firebase/data";


export default function HomePage() {
  const router = useRouter();
  const { user, authReady, profileLoading, data } = useOnboarding();
  const { searchValue, activeView } = useSiteLayout();
  const [promptState, setPromptState] = useState<{
    workspaceId: string;
    prompts: Prompt[];
    loading: boolean;
  }>({ workspaceId: "", prompts: [], loading: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [pageError, setPageError] = useState("");
  const [copiedPromptId, setCopiedPromptId] = useState("");
  const [publishingId, setPublishingId] = useState("");

  useEffect(() => {
    if (authReady && !user) router.replace("/");
    if (authReady && user && !profileLoading && !data.onboardingComplete) {
      router.replace("/register/step-2");
    }
  }, [authReady, data.onboardingComplete, profileLoading, router, user]);

  useEffect(() => {
    if (!user || !data.primaryWorkspaceId || !data.onboardingComplete) return;
    const workspaceId = data.primaryWorkspaceId;
    return subscribeToPrompts(
      workspaceId,
      (nextPrompts) => {
        setPromptState({ workspaceId, prompts: nextPrompts, loading: false });
        setPageError("");
      },
      () => {
        setPromptState({ workspaceId, prompts: [], loading: false });
        setPageError("Não foi possível carregar seus prompts. Confira sua conexão e tente novamente.");
      },
    );
  }, [data.onboardingComplete, data.primaryWorkspaceId, user]);

  const promptsLoading =
    !data.primaryWorkspaceId ||
    promptState.workspaceId !== data.primaryWorkspaceId ||
    promptState.loading;

  const visiblePrompts = useMemo(() => {
    const prompts = promptState.workspaceId === data.primaryWorkspaceId
      ? promptState.prompts
      : [];
    const search = searchValue.trim().toLocaleLowerCase();
    return prompts.filter((prompt) => {
      const matchesView = activeView === "all" || prompt.isFavorite;
      const matchesSearch = !search || `${prompt.title} ${prompt.content}`.toLocaleLowerCase().includes(search);
      return matchesView && matchesSearch;
    });
  }, [activeView, data.primaryWorkspaceId, promptState, searchValue]);

  function openNewPrompt(title = "") {
    setDialogKey((key) => key + 1);
    setSelectedPrompt(null);
    setDraftTitle(title);
    setDialogError("");
    setDialogOpen(true);
  }

  function openPrompt(prompt: Prompt) {
    setDialogKey((key) => key + 1);
    setSelectedPrompt(prompt);
    setDialogError("");
    setDialogOpen(true);
  }

  async function savePrompt(title: string, content: string, details: PromptDetails) {
    if (!user || !data.primaryWorkspaceId) return;
    setSavingPrompt(true);
    setDialogError("");
    try {
      if (selectedPrompt) {
        await updatePrompt(data.primaryWorkspaceId, selectedPrompt.id, title, content, details);
      } else {
        await createPrompt(data.primaryWorkspaceId, user.uid, title, content, details);
        setDraftTitle("");
      }
      setDialogOpen(false);
      setSelectedPrompt(null);
    } catch (saveError) {
      setDialogError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o prompt.");
    } finally {
      setSavingPrompt(false);
    }
  }

  async function toggleFavorite(prompt: Prompt) {
    if (!data.primaryWorkspaceId) return;
    try {
      await setPromptFavorite(data.primaryWorkspaceId, prompt.id, !prompt.isFavorite);
    } catch {
      setPageError("Não foi possível atualizar os favoritos.");
    }
  }

  async function copyPrompt(prompt: Prompt) {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedPromptId(prompt.id);
      window.setTimeout(() => setCopiedPromptId(""), 1800);
    } catch {
      setPageError("Não foi possível copiar o prompt para a área de transferência.");
    }
  }

  async function duplicatePrompt(prompt: Prompt) {
    if (!user || !data.primaryWorkspaceId) return;
    try {
      await createPrompt(data.primaryWorkspaceId, user.uid, `${prompt.title.slice(0, 110)} (cópia)`, prompt.content, { description: prompt.description, category: prompt.category, model: prompt.model, images: prompt.images });
    } catch { setPageError("Não foi possível duplicar o prompt."); }
  }

  async function togglePublication(prompt: Prompt) {
    if (!user || publishingId) return;
    setPublishingId(prompt.id); setPageError("");
    try { await setPromptPublication(data.primaryWorkspaceId, user.uid, prompt.id, !prompt.isPublished); }
    catch (error) { setPageError(error instanceof Error ? error.message : "Não foi possível alterar a publicação do prompt."); }
    finally { setPublishingId(""); }
  }

  async function deletePrompt(prompt: Prompt) {
    if (!data.primaryWorkspaceId || !window.confirm(`Excluir “${prompt.title}”?`)) return;
    try {
      await removePrompt(data.primaryWorkspaceId, prompt.id);
    } catch {
      setPageError("Não foi possível excluir o prompt.");
    }
  }

  if (!authReady || profileLoading || !user || !data.onboardingComplete) {
    return <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background text-muted">Carregando seu espaço...</main>;
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-background text-foreground">

      <main className="flex min-h-[calc(100dvh-4rem)] flex-col pt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 sm:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-3xl font-semibold">Sua biblioteca</h1><p className="mt-2 text-sm text-muted">Crie, organize e escolha o que compartilhar.</p></div>
            <button type="button" onClick={() => openNewPrompt()} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">+ Novo prompt</button>
          </div>
          <section className="pb-12">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <p className="text-sm text-muted">Seu perfil é público. Escolha os prompts que quer compartilhar.</p>
              <Link href="/home/profile" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Meu perfil de criador</Link>
            </div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {activeView === "favorites" ? "Favoritos" : "Seus prompts"}
              </h2>
              <span className="text-sm text-subtle">{visiblePrompts.length} salvos</span>
            </div>

            {pageError && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-700">{pageError}</p>}

            {promptsLoading ? (
              <p className="py-12 text-center text-sm text-subtle">Carregando prompts…</p>
            ) : visiblePrompts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="font-medium">{activeView === "favorites" ? "Nenhum favorito ainda" : "Sua biblioteca está vazia"}</p>
                <p className="mt-2 text-sm text-subtle">{activeView === "favorites" ? "Favorite um prompt para encontrá-lo aqui." : "Crie seu primeiro prompt para começar."}</p>
                {activeView === "all" && <button onClick={() => openNewPrompt()} className="mt-5 rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5">Criar meu primeiro prompt</button>}
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {visiblePrompts.map((prompt) => (
                  <ActionNode key={prompt.id} title={prompt.title} description="" className="mind-node-library" actions={[
                    { id: "edit", label: `Editar ${prompt.title}`, icon: Pencil, onClick: () => openPrompt(prompt) },
                    { id: "copy", label: `Copiar ${prompt.title}`, icon: Copy, onClick: () => void copyPrompt(prompt) },
                    { id: "favorite", label: prompt.isFavorite ? "Remover dos favoritos" : "Favoritar prompt", icon: Star, onClick: () => void toggleFavorite(prompt) },
                    { id: "duplicate", label: `Duplicar ${prompt.title}`, icon: Files, onClick: () => void duplicatePrompt(prompt) },
                  ]}>
                    <Link href={`/home/prompts/${encodeURIComponent(prompt.id)}`} aria-label={`Abrir página do prompt ${prompt.title}`} className="block min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-foreground">
                      <h3 className="truncate pr-5 font-medium">{prompt.title}</h3>
                      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted">{prompt.content}</p>
                    </Link>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-subtle">
                      <span>{copiedPromptId === prompt.id ? "Prompt copiado" : prompt.updatedAt ? `Atualizado ${new Date(prompt.updatedAt).toLocaleDateString("pt-BR")}` : "Salvo recentemente"}</span>
                      <button type="button" disabled={Boolean(publishingId)} onClick={() => void togglePublication(prompt)} className="rounded-md px-2 py-1 hover:bg-foreground/10 disabled:opacity-40">{publishingId === prompt.id ? "Salvando…" : prompt.isPublished ? "Tornar privado" : "Publicar"}</button>
                      <button type="button" aria-label={`Excluir ${prompt.title}`} onClick={() => void deletePrompt(prompt)} className="rounded-md p-1.5 hover:bg-red-400/10 hover:text-red-700"><Trash2 size={15} /></button>
                    </div>
                    {prompt.isPublished && <Link href={`/share/${user.uid}/${prompt.id}`} className="mt-3 block text-xs text-muted underline">Abrir link público</Link>}
                  </ActionNode>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <PromptDialog
        key={dialogKey}
        isOpen={dialogOpen}
        prompt={selectedPrompt}
        initialTitle={draftTitle}
        pending={savingPrompt}
        error={dialogError}
        onClose={() => setDialogOpen(false)}
        onSave={(title, content, details) => void savePrompt(title, content, details)}
      />
    </div>
  );
}
