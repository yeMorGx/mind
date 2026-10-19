"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import LibraryPromptCard from "@/components/catalog/LibraryPromptCard";
import { matchesCatalog } from "@/lib/catalog";
import { useCatalogOptions, useSiteLayout } from "@/components/layout/SiteLayout";
import PromptDialog from "@/components/prompts/PromptDialog";
import { useOnboarding } from "@/app/context/OnboardingContext";
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
 const { t } = useI18n();

  const router = useRouter();
  const { user, authReady, profileLoading, data } = useOnboarding();
  const { searchValue, activeView, category, model, setCategory, setModel, newPromptOpen, newPromptVersion, openNewPrompt: requestNewPrompt, closeNewPrompt } = useSiteLayout();
  const [promptState, setPromptState] = useState<{
    workspaceId: string;
    prompts: Prompt[];
    loading: boolean;
  }>({ workspaceId: "", prompts: [], loading: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [pageError, setPageError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");

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

  const allPrompts = useMemo(() => promptState.workspaceId === data.primaryWorkspaceId ? promptState.prompts : [], [promptState, data.primaryWorkspaceId]);
  const catalogOptions = useCatalogOptions(allPrompts);
  const visiblePrompts = useMemo(() => allPrompts.filter(prompt => (activeView !== "favorites" || prompt.isFavorite) && matchesCatalog(prompt, searchValue, category, model, data.name || user?.displayName || "")).sort((a,b)=>data.preferences?.favoritesFirst?Number(b.isFavorite)-Number(a.isFavorite):0), [allPrompts, activeView, searchValue, category, model, data.name, user?.displayName, data.preferences?.favoritesFirst]);
  function openNewPrompt() { setSelectedPrompt(null); setDialogError(""); requestNewPrompt(); }
  function closeDialog() { setDialogOpen(false); closeNewPrompt(); setSelectedPrompt(null); setDialogError(""); }

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
      if (selectedPrompt && !newPromptOpen) {
        await updatePrompt(data.primaryWorkspaceId, selectedPrompt.id, title, content, details);
      } else {
        await createPrompt(data.primaryWorkspaceId, user.uid, title, content, details);
      }
      closeDialog();
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
      setCopyNotice("Prompt copiado.");
      window.setTimeout(() => setCopyNotice(""), 1800);
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

  async function deletePrompt(prompt: Prompt) {
    if (!data.primaryWorkspaceId || !window.confirm(`Excluir “${prompt.title}”?`)) return;
    try {
      await removePrompt(data.primaryWorkspaceId, prompt.id);
    } catch {
      setPageError("Não foi possível excluir o prompt.");
    }
  }

  if (!authReady || profileLoading || !user || !data.onboardingComplete) {
    return <main className="catalog-page flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-background text-muted">{t("Carregando seu espaço...")}</main>;
  }

  return (
    <div className="relative min-h-[calc(100dvh-4.5rem)] overflow-hidden bg-background text-foreground">

      <main className="catalog-page flex min-h-[calc(100dvh-4.5rem)] flex-col pt-7">
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-5 sm:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-2xl font-semibold tracking-tight">{activeView === "favorites" ? t("Favoritos") : t("Meus prompts")}</h1><p className="mt-2 text-sm text-muted">{t("Crie, organize e escolha o que compartilhar.")}</p></div>
            <CatalogFilters categories={[]} models={catalogOptions.models} />
          </div>
          <section className="pb-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="catalog-library-categories flex gap-2">{[["", "Tudo"], ...[...new Set(allPrompts.map(prompt => prompt.category || (prompt.images.length ? "Imagem" : "Texto")))].map(value => [value,value])].map(([value,label]) => <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={category === value} className={`catalog-filter-chip ${category === value ? "is-active" : ""}`}>{label}</button>)}</div>
              <span className="text-xs text-subtle">{visiblePrompts.length} {visiblePrompts.length === 1 ? t("prompt") : t("prompts")}</span>
            </div>
            {model && <button type="button" onClick={() => setModel("")} className="catalog-filter-chip mb-5 inline-flex items-center gap-2" aria-label={t("Remover modelo {v0}", {v0: (model)})}>{model}<X size={14} /></button>}
            {pageError && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-700">{pageError}</p>}

            {promptsLoading ? (
              <p className="py-12 text-center text-sm text-subtle">{t("Carregando prompts…")}</p>
            ) : visiblePrompts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="font-medium">{searchValue || category || model ? t("Nenhum prompt com esses filtros") : activeView === "favorites" ? t("Nenhum favorito ainda") : t("Sua biblioteca está vazia")}</p>
                <p className="mt-2 text-sm text-subtle">{searchValue || category || model ? t("Tente outra busca ou remova um filtro.") : activeView === "favorites" ? t("Favorite um prompt para encontrá-lo aqui.") : t("Crie seu primeiro prompt para começar.")}</p>
                {activeView === "all" && <button onClick={() => openNewPrompt()} className="mt-5 rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5">{t("Criar meu primeiro prompt")}</button>}
              </div>
            ) : (
              <div className="catalog-grid catalog-library-grid">
                {visiblePrompts.map(prompt => <LibraryPromptCard key={prompt.id} prompt={prompt}
                  onEdit={() => openPrompt(prompt)} onCopy={() => void copyPrompt(prompt)} onFavorite={() => void toggleFavorite(prompt)} onDuplicate={() => void duplicatePrompt(prompt)} onDelete={() => void deletePrompt(prompt)} />)}
              </div>
            )}
          </section>
        </div>
      </main>

      <span className="sr-only" role="status">{copyNotice}</span>
      <PromptDialog
        key={newPromptOpen ? `new:${newPromptVersion}` : `edit:${dialogKey}`}
        isOpen={dialogOpen || newPromptOpen}
        prompt={newPromptOpen ? null : selectedPrompt}
        defaults={{category:data.preferences?.defaultCategory,model:data.preferences?.defaultModel}}
        pending={savingPrompt}
        error={dialogError}
        onClose={closeDialog}
        onSave={(title, content, details) => void savePrompt(title, content, details)}
      />
    </div>
  );
}
