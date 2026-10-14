"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { Copy, Files, Pencil, Star, Trash2 } from "lucide-react";
import Sidebar, { type PromptView } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ActionNode } from "@/components/ui/ActionNode";
import PromptDialog from "@/components/prompts/PromptDialog";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getFirebaseServices } from "@/lib/firebase/client";
import { getSupabaseClient } from "@/lib/supabase/client";
import { setNativeBackend } from "@/lib/backend";
import { setPromptPublication } from "@/lib/firebase/publication";
import type { PromptDetails } from "@/lib/prompt-media";
import {
  createPrompt,
  getWorkspace,
  removePrompt,
  setPromptFavorite,
  subscribeToPrompts,
  updatePrompt,
  type Prompt,
} from "@/lib/firebase/data";


export default function HomePage() {
  const router = useRouter();
  const { user, authReady, profileLoading, data } = useOnboarding();
  const [workspace, setWorkspace] = useState<{ name?: string; icon?: string } | null>(null);
  const [promptState, setPromptState] = useState<{
    workspaceId: string;
    prompts: Prompt[];
    loading: boolean;
  }>({ workspaceId: "", prompts: [], loading: true });
  const [searchValue, setSearchValue] = useState("");
  const [activeView, setActiveView] = useState<PromptView>("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    let active = true;
    void getWorkspace(data.primaryWorkspaceId)
      .then((result) => {
        if (active) {
          setWorkspace(result ? { name: String(result.name ?? ""), icon: String(result.icon ?? "🧠") } : null);
          setPageError("");
        }
      })
      .catch(() => {
        if (active) setPageError("Não foi possível carregar seu workspace.");
      });

    return () => {
      active = false;
    };
  }, [data.onboardingComplete, data.primaryWorkspaceId, user]);

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
    catch (error) { setPageError(error instanceof Error && error.message.startsWith("Publique") ? error.message : "Não foi possível alterar a publicação do prompt."); }
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

  async function handleSignOut() {
    const services = getFirebaseServices();
    try {
      const supabase = getSupabaseClient();
      if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
      if (services) await signOut(services.auth);
      localStorage.removeItem("mind-native-session");
      setNativeBackend(false);
      window.dispatchEvent(new Event("mind:session"));
      router.replace("/");
    } catch {
      setPageError("Não foi possível sair da conta.");
    }
  }

  if (!authReady || profileLoading || !user || !data.onboardingComplete) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white/60">Carregando seu espaço...</main>;
  }

  const workspaceName = workspace?.name || data.workspaceName || "Meu workspace";
  const workspaceIcon = workspace?.icon || data.workspaceIcon || "🧠";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        workspaceName={workspaceName}
        workspaceIcon={workspaceIcon}
        userName={data.name || user.displayName || user.email || "Mind user"}
        onViewChange={setActiveView}
        onSignOut={() => void handleSignOut()}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onMenuClick={() => setMobileNavOpen(true)} />

      <main className="ml-0 flex min-h-screen flex-col pt-24 md:ml-20">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 md:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-3xl font-semibold">Sua biblioteca</h1><p className="mt-2 text-sm text-white/55">Crie, organize e escolha o que compartilhar.</p></div>
            <button type="button" onClick={() => openNewPrompt()} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90">+ Novo prompt</button>
          </div>
          <section className="pb-12">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
              <p className="text-sm text-white/60">Publique seu perfil e escolha os prompts que quer divulgar.</p>
              <Link href="/home/profile" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Meu perfil de criador</Link>
            </div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {activeView === "favorites" ? "Favoritos" : "Seus prompts"}
              </h2>
              <span className="text-sm text-white/40">{visiblePrompts.length} salvos</span>
            </div>

            {pageError && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{pageError}</p>}

            {promptsLoading ? (
              <p className="py-12 text-center text-sm text-white/45">Carregando prompts…</p>
            ) : visiblePrompts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
                <p className="font-medium">{activeView === "favorites" ? "Nenhum favorito ainda" : "Sua biblioteca está vazia"}</p>
                <p className="mt-2 text-sm text-white/45">{activeView === "favorites" ? "Favorite um prompt para encontrá-lo aqui." : "Crie seu primeiro prompt para começar."}</p>
                {activeView === "all" && <button onClick={() => openNewPrompt()} className="mt-5 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Criar meu primeiro prompt</button>}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visiblePrompts.map((prompt) => (
                  <ActionNode key={prompt.id} title={prompt.title} description="" className="mind-node-library" actions={[
                    { id: "edit", label: `Editar ${prompt.title}`, icon: Pencil, onClick: () => openPrompt(prompt) },
                    { id: "copy", label: `Copiar ${prompt.title}`, icon: Copy, onClick: () => void copyPrompt(prompt) },
                    { id: "favorite", label: prompt.isFavorite ? "Remover dos favoritos" : "Favoritar prompt", icon: Star, onClick: () => void toggleFavorite(prompt) },
                    { id: "duplicate", label: `Duplicar ${prompt.title}`, icon: Files, onClick: () => void duplicatePrompt(prompt) },
                  ]}>
                    <Link href={`/home/prompts/${encodeURIComponent(prompt.id)}`} aria-label={`Abrir página do prompt ${prompt.title}`} className="block min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-white">
                      <h3 className="truncate pr-5 font-medium">{prompt.title}</h3>
                      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-white/50">{prompt.content}</p>
                    </Link>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/40">
                      <span>{copiedPromptId === prompt.id ? "Prompt copiado" : prompt.updatedAt ? `Atualizado ${new Date(prompt.updatedAt).toLocaleDateString("pt-BR")}` : "Salvo recentemente"}</span>
                      <button type="button" disabled={Boolean(publishingId)} onClick={() => void togglePublication(prompt)} className="rounded-md px-2 py-1 hover:bg-white/10 disabled:opacity-40">{publishingId === prompt.id ? "Salvando…" : prompt.isPublished ? "Tornar privado" : "Publicar"}</button>
                      <button type="button" aria-label={`Excluir ${prompt.title}`} onClick={() => void deletePrompt(prompt)} className="rounded-md p-1.5 hover:bg-red-400/10 hover:text-red-200"><Trash2 size={15} /></button>
                    </div>
                    {prompt.isPublished && <Link href={`/share/${user.uid}/${prompt.id}`} className="mt-3 block text-xs text-white/70 underline">Abrir link público</Link>}
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
