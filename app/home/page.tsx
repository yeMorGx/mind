"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import { Copy, Star, Trash2 } from "lucide-react";
import Sidebar, { type PromptView } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/input";
import { Spotlight } from "@/components/ui/spotlight";
import PromptDialog from "@/components/prompts/PromptDialog";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getFirebaseServices } from "@/lib/firebase/client";
import {
  createPrompt,
  getWorkspace,
  removePrompt,
  setPromptFavorite,
  subscribeToPrompts,
  updatePrompt,
  type Prompt,
} from "@/lib/firebase/data";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" });

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
        setPageError("Não foi possível carregar seus prompts. Confira as regras do Firestore.");
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

  async function savePrompt(title: string, content: string) {
    if (!user || !data.primaryWorkspaceId) return;
    setSavingPrompt(true);
    setDialogError("");
    try {
      if (selectedPrompt) {
        await updatePrompt(data.primaryWorkspaceId, selectedPrompt.id, title, content);
      } else {
        await createPrompt(data.primaryWorkspaceId, user.uid, title, content);
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
    if (!services) return;
    try {
      await signOut(services.auth);
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
      <Spotlight />
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

      <main className="ml-0 flex min-h-screen flex-col md:ml-72">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 md:px-8">
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <motion.h1
              initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 1 }}
              className={`${instrumentSerif.className} mb-8 text-center text-5xl`}
            >
              Keep every great prompt organized.
            </motion.h1>

            <div className="w-full max-w-3xl">
              <Input
                value={draftTitle}
                onChange={setDraftTitle}
                onEnter={() => openNewPrompt(draftTitle.trim())}
                placeholder="Start with a prompt title..."
                className="py-4"
              />
              <div className="mt-4 flex justify-center">
                <button onClick={() => openNewPrompt(draftTitle.trim())} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                  + New prompt
                </button>
              </div>
            </div>
          </div>

          <section className="pb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {activeView === "favorites" ? "Favorite prompts" : "Your prompts"}
              </h2>
              <span className="text-sm text-white/40">{visiblePrompts.length} saved</span>
            </div>

            {pageError && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{pageError}</p>}

            {promptsLoading ? (
              <p className="py-12 text-center text-sm text-white/45">Loading prompts...</p>
            ) : visiblePrompts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
                <p className="font-medium">{activeView === "favorites" ? "No favorite prompts yet" : "Your library is empty"}</p>
                <p className="mt-2 text-sm text-white/45">{activeView === "favorites" ? "Mark a prompt as favorite to find it here." : "Save your first prompt to start building your library."}</p>
                {activeView === "all" && <button onClick={() => openNewPrompt()} className="mt-5 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Create your first prompt</button>}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visiblePrompts.map((prompt) => (
                  <motion.article
                    key={prompt.id}
                    whileHover={{ y: -3 }}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md"
                  >
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => openPrompt(prompt)} className="min-w-0 flex-1 text-left">
                        <h3 className="truncate font-medium">{prompt.title}</h3>
                        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-white/50">{prompt.content}</p>
                      </button>
                      <button
                        type="button"
                        aria-label={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        aria-pressed={prompt.isFavorite}
                        onClick={() => void toggleFavorite(prompt)}
                        className="rounded-lg p-2 text-white/45 transition hover:bg-white/5 hover:text-yellow-200"
                      >
                        <Star size={17} fill={prompt.isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/40">
                      <span>{prompt.updatedAt ? `Updated ${new Date(prompt.updatedAt).toLocaleDateString("pt-BR")}` : "Recently saved"}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Copiar ${prompt.title}`}
                          onClick={() => void copyPrompt(prompt)}
                          className="flex items-center gap-1.5 rounded-md p-1.5 text-white/45 transition hover:bg-white/5 hover:text-white"
                        >
                          <Copy size={14} />
                          {copiedPromptId === prompt.id ? "Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir ${prompt.title}`}
                          onClick={() => void deletePrompt(prompt)}
                          className="rounded-md p-1.5 text-white/35 transition hover:bg-red-400/10 hover:text-red-200"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.article>
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
        onSave={(title, content) => void savePrompt(title, content)}
      />
    </div>
  );
}
