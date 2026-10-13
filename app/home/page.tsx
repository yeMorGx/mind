"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import { Copy, ExternalLink, Share2, Star, Trash2 } from "lucide-react";
import Sidebar, { type PromptView } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/input";
import { Spotlight } from "@/components/ui/spotlight";
import PromptDialog from "@/components/prompts/PromptDialog";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  listMyPrompts,
  removePrompt,
  savePrompt as savePromptData,
  setPromptFavorite,
} from "@/lib/supabase/data";
import type { Prompt, PromptDraft } from "@/lib/supabase/types";

/* eslint-disable @next/next/no-img-element -- Supabase returns short-lived signed image URLs. */

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" });

export default function HomePage() {
  const router = useRouter();
  const { user, authReady, profileLoading, data, supabaseConfigured } = useOnboarding();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [notice, setNotice] = useState("");
  const [copiedPromptId, setCopiedPromptId] = useState("");

  useEffect(() => {
    if (authReady && !user) router.replace("/");
    if (authReady && user && !profileLoading && !data.onboardingComplete) {
      router.replace("/register/step-2");
    }
  }, [authReady, data.onboardingComplete, profileLoading, router, user]);

  const refreshPrompts = useCallback(async () => {
    if (!user || !data.onboardingComplete) return;
    setLoading(true);
    try {
      setPrompts(await listMyPrompts(user.id));
      setPageError("");
    } catch {
      setPageError("Não foi possível carregar suas publicações. Confira se o SQL de configuração foi executado no Supabase.");
    } finally {
      setLoading(false);
    }
  }, [data.onboardingComplete, user]);

  useEffect(() => {
    if (!user || !data.onboardingComplete) return;
    let active = true;
    void listMyPrompts(user.id)
      .then((nextPrompts) => {
        if (!active) return;
        setPrompts(nextPrompts);
        setPageError("");
      })
      .catch(() => {
        if (active) setPageError("Não foi possível carregar suas publicações. Confira se o SQL de configuração foi executado no Supabase.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [data.onboardingComplete, user]);

  const visiblePrompts = useMemo(() => {
    const search = searchValue.trim().toLocaleLowerCase();
    return prompts.filter((prompt) => {
      const matchesView = activeView === "all" || prompt.isFavorite;
      const matchesSearch = !search || `${prompt.title} ${prompt.content} ${prompt.description} ${prompt.category}`.toLocaleLowerCase().includes(search);
      return matchesView && matchesSearch;
    });
  }, [activeView, prompts, searchValue]);

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
    setDraftTitle("");
    setDialogError("");
    setDialogOpen(true);
  }

  async function handleSavePrompt(draft: PromptDraft) {
    if (!user) return;
    setSavingPrompt(true);
    setDialogError("");
    setNotice("");
    try {
      const saved = await savePromptData(user, data, selectedPrompt, draft);
      await refreshPrompts();
      setDialogOpen(false);
      setSelectedPrompt(null);
      setDraftTitle("");
      if (draft.status === "published") {
        setNotice("Seu prompt foi publicado. O link já está pronto para compartilhar.");
        setCopiedPromptId(saved.id);
      } else {
        setNotice("Rascunho salvo. Você pode voltar e publicar quando estiver pronto.");
      }
    } catch (saveError) {
      setDialogError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o prompt.");
    } finally {
      setSavingPrompt(false);
    }
  }

  async function toggleFavorite(prompt: Prompt) {
    if (!user) return;
    try {
      await setPromptFavorite(user.id, prompt.id, !prompt.isFavorite);
      await refreshPrompts();
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

  async function sharePrompt(prompt: Prompt) {
    const url = `${window.location.origin}/p/${prompt.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: prompt.title, text: `Use este prompt que encontrei no Mind: ${prompt.title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNotice("Link copiado. Envie para seus seguidores.");
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      setPageError("Não foi possível compartilhar o link.");
    }
  }

  async function deletePrompt(prompt: Prompt) {
    if (!user || !window.confirm(`Excluir “${prompt.title}”?`)) return;
    try {
      await removePrompt(user.id, prompt);
      await refreshPrompts();
      setNotice("Publicação excluída.");
    } catch {
      setPageError("Não foi possível excluir esta publicação.");
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setPageError("Não foi possível sair da conta.");
      return;
    }
    router.replace("/");
  }

  if (!authReady || profileLoading || !user || !data.onboardingComplete) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white/60">Carregando seu painel…</main>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Spotlight />
      <Sidebar
        activeView={activeView}
        creatorName={data.creatorName || data.name || "Perfil do criador"}
        creatorIcon={data.creatorIcon || "✨"}
        userName={data.name || user.email || "Criador Mind"}
        onViewChange={setActiveView}
        onSignOut={() => void handleSignOut()}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onMenuClick={() => setMobileNavOpen(true)} />

      <main className="ml-0 flex min-h-screen flex-col md:ml-72">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 md:px-8">
          <section className="flex flex-col items-start justify-center gap-8 py-14 sm:flex-row sm:items-end sm:justify-between sm:py-20">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-white/40">Painel do criador</p>
              <motion.h1
                initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.8 }}
                className={`${instrumentSerif.className} max-w-2xl text-5xl leading-[1.05] sm:text-6xl`}
              >
                Transforme seus prompts em páginas para compartilhar.
              </motion.h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
                Mostre exemplos, explique como usou e publique um link que qualquer pessoa pode abrir e copiar.
              </p>
            </div>
            <button type="button" onClick={() => openNewPrompt()} className="shrink-0 rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90">
              + Criar publicação
            </button>
          </section>

          <div className="mb-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
            <Input value={draftTitle} onChange={setDraftTitle} onEnter={() => openNewPrompt(draftTitle.trim())} placeholder="Dê um título ao novo prompt…" className="py-4" />
            <button type="button" onClick={() => openNewPrompt(draftTitle.trim())} className="rounded-xl border border-white/15 px-5 py-3 text-sm text-white/80 hover:bg-white/5">Começar</button>
          </div>

          {(pageError || notice) && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
              <p role={pageError ? "alert" : "status"} className={pageError ? "text-red-200" : "text-emerald-100"}>{pageError || notice}</p>
              {notice && copiedPromptId && prompts.find((prompt) => prompt.id === copiedPromptId)?.status === "published" && (
                <button type="button" onClick={() => { const prompt = prompts.find((item) => item.id === copiedPromptId); if (prompt) void sharePrompt(prompt); }} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Share2 size={14} /> Compartilhar</button>
              )}
            </div>
          )}

          <section className="flex-1 pb-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">{activeView === "favorites" ? "Favoritos" : "Suas publicações"}</h2>
                <p className="mt-1 text-sm text-white/40">{visiblePrompts.length} {visiblePrompts.length === 1 ? "prompt" : "prompts"}</p>
              </div>
            </div>

            {!supabaseConfigured && <p role="alert" className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">Configure o Supabase para carregar seu conteúdo.</p>}

            {loading ? (
              <p className="py-12 text-center text-sm text-white/45">Carregando publicações…</p>
            ) : visiblePrompts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
                <p className="font-medium">{activeView === "favorites" ? "Você ainda não favoritou prompts" : "Seu painel ainda está vazio"}</p>
                <p className="mt-2 text-sm text-white/45">Crie uma publicação, adicione imagens e compartilhe com seus seguidores.</p>
                {activeView === "all" && <button type="button" onClick={() => openNewPrompt()} className="mt-5 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Criar primeiro prompt</button>}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visiblePrompts.map((prompt) => {
                  const cover = prompt.images.find((image) => image.role === "gallery") ?? prompt.images.find((image) => image.role === "after") ?? prompt.images[0];
                  return (
                    <motion.article key={prompt.id} whileHover={{ y: -3 }} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
                      <button type="button" onClick={() => openPrompt(prompt)} className="block w-full text-left">
                        {cover ? <img src={cover.url} alt={cover.label || prompt.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-white/[0.025] text-white/25">Adicione uma imagem de resultado</div>}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="line-clamp-2 font-medium">{prompt.title}</h3>
                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${prompt.status === "published" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-white/15 text-white/45"}`}>
                              {prompt.status === "published" ? "Publicado" : "Rascunho"}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-white/45">{prompt.description || prompt.content}</p>
                        </div>
                      </button>
                      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/40">
                        <span>{prompt.category || prompt.model || "Prompt"}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" aria-label={prompt.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} aria-pressed={prompt.isFavorite} onClick={() => void toggleFavorite(prompt)} className="rounded-md p-2 hover:bg-white/5 hover:text-yellow-100"><Star size={15} fill={prompt.isFavorite ? "currentColor" : "none"} /></button>
                          {prompt.status === "published" && <>
                            <button type="button" aria-label={`Copiar link de ${prompt.title}`} onClick={() => void sharePrompt(prompt)} className="rounded-md p-2 hover:bg-white/5 hover:text-white"><Share2 size={15} /></button>
                            <a aria-label={`Abrir ${prompt.title}`} href={`/p/${prompt.slug}`} target="_blank" rel="noreferrer" className="rounded-md p-2 hover:bg-white/5 hover:text-white"><ExternalLink size={15} /></a>
                          </>}
                          <button type="button" aria-label={`Copiar prompt ${prompt.title}`} onClick={() => void copyPrompt(prompt)} className="rounded-md p-2 hover:bg-white/5 hover:text-white">{copiedPromptId === prompt.id ? "OK" : <Copy size={14} />}</button>
                          <button type="button" aria-label={`Excluir ${prompt.title}`} onClick={() => void deletePrompt(prompt)} className="rounded-md p-2 text-white/35 hover:bg-red-400/10 hover:text-red-200"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
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
        onSave={(draft) => void handleSavePrompt(draft)}
      />
    </div>
  );
}
