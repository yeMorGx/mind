"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Prompt } from "@/lib/firebase/data";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { preparePromptImage, validatePromptDetails, MAX_PROMPT_IMAGES, MAX_IMAGES_CHARS, type PromptDetails, type StoredPromptImage, type PromptImageRole } from "@/lib/prompt-media";

type PromptDialogProps = {
  isOpen: boolean;
  prompt: Prompt | null;
  initialTitle?: string;
  pending: boolean;
  error: string;
  onClose: () => void;
  onSave: (title: string, content: string, details: PromptDetails) => void;
};

export default function PromptDialog({
  isOpen,
  prompt,
  initialTitle = "",
  pending,
  error,
  onClose,
  onSave,
}: PromptDialogProps) {
  const [title, setTitle] = useState(prompt?.title ?? initialTitle);
  const [content, setContent] = useState(prompt?.content ?? "");
  const [description, setDescription] = useState(prompt?.description ?? "");
  const [model, setModel] = useState(prompt?.model ?? "");
  const [category, setCategory] = useState(prompt?.category ?? "");
  const [images, setImages] = useState<StoredPromptImage[]>(prompt?.images ?? []);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const [localError, setLocalError] = useState("");
  const locked = pending || processing;

  async function addImages(files: File[]) {
    processingRef.current = true;
    setProcessing(true);
    try {
      const prepared = await Promise.all(files.map(preparePromptImage));
      const next = [...images, ...prepared];
      if (next.length > MAX_PROMPT_IMAGES || next.reduce((size, image) => size + image.url.length, 0) > MAX_IMAGES_CHARS) throw new Error("As imagens juntas estão muito grandes. Remova algumas ou escolha versões menores.");
      setImages(next);
      setLocalError("");
    } finally { processingRef.current = false; setProcessing(false); }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Fechar editor de prompt"
            className="fixed inset-0 z-40 cursor-default bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!locked) onClose(); }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (locked || processingRef.current) return;
                const details = { description, category, model, images };
                try { validatePromptDetails(title, content, details); setLocalError(""); onSave(title, content, details); }
                catch (failure) { setLocalError(failure instanceof Error ? failure.message : "Confira os dados do prompt."); }
              }}
              className="my-auto w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="prompt-dialog-title" className="text-2xl font-semibold">
                    {prompt ? "Editar prompt" : "Novo prompt"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Salve um título e o conteúdo que você quer guardar.
                  </p>
                </div>
                <button type="button" disabled={locked} onClick={onClose} className="rounded-lg px-3 py-2 text-muted hover:bg-foreground/5 hover:text-foreground disabled:opacity-40">
                  Fechar
                </button>
              </div>

              <label htmlFor="prompt-title" className="mt-6 block text-sm text-muted">
                Título
              </label>
              <input
                id="prompt-title"
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Retrato com luz de estúdio"
                className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30"
              />

              <label htmlFor="prompt-content" className="mt-5 block text-sm text-muted">
                Prompt
              </label>
              <textarea
                id="prompt-content"
                required
                rows={9}
                maxLength={20000}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Escreva ou cole seu prompt…"
                className="mt-2 w-full resize-y rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30"
              />

              <label htmlFor="prompt-description" className="mt-5 block text-sm text-muted">Descrição e instruções de uso</label>
              <textarea id="prompt-description" maxLength={500} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" placeholder="Explique o resultado e como usar o prompt." />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-muted">Categoria<input maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" placeholder="Ex.: Retratos" /></label>
                <label className="text-sm text-muted">Modelo / ferramenta<input maxLength={80} value={model} onChange={(event) => setModel(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" placeholder="Ex.: Midjourney" /></label>
              </div>
              <section className="mt-6" aria-labelledby="prompt-images-heading">
                <h3 id="prompt-images-heading" className="mb-3 text-sm font-medium text-muted">Imagens do prompt <span className="text-subtle">{images.length}/{MAX_PROMPT_IMAGES}</span></h3>
                <UploadDropzone onFiles={addImages} disabled={locked} remaining={MAX_PROMPT_IMAGES - images.length} />
                <p className="mt-2 text-xs leading-5 text-subtle">As imagens são otimizadas para a galeria e ficam salvas junto com o prompt.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {images.map((image) => <div key={image.id} className="overflow-hidden rounded-xl border border-border bg-foreground/[0.02]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Optimized, bounded data URLs from local image files. */}
                    <img src={image.url} alt={image.label || "Imagem do prompt"} className="aspect-[4/3] w-full object-contain" />
                    <div className="space-y-2 p-3">
                      <input aria-label="Legenda da imagem" disabled={locked} maxLength={120} value={image.label} onChange={(event) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, label: event.target.value } : item))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs" />
                      <div className="flex items-center justify-between gap-2">
                        <select aria-label="Função da imagem" disabled={locked} value={image.role} onChange={(event) => {
                          const role = event.target.value as PromptImageRole;
                          setImages((current) => current.map((item) => item.id === image.id ? { ...item, role } : (role === "before" || role === "after") && item.role === role ? { ...item, role: "gallery" } : item));
                        }} className="rounded-lg border border-border bg-surface px-2 py-2 text-xs"><option value="gallery">Resultado</option><option value="reference">Referência</option><option value="before">Antes</option><option value="after">Depois</option></select>
                        <button type="button" aria-label={`Remover imagem ${image.label}`} disabled={locked} onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))} className="text-xs text-red-700/70 hover:text-red-700">Remover</button>
                      </div>
                    </div>
                  </div>)}
                </div>
              </section>
              {(localError || error) && <p role="alert" className="mt-4 text-sm text-red-700">{localError || error}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" disabled={locked} onClick={onClose} className="rounded-xl border border-border px-5 py-3 text-muted hover:bg-foreground/5 disabled:opacity-40">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={locked || !title.trim() || !content.trim()}
                  className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "Salvando…" : prompt ? "Salvar alterações" : "Salvar prompt"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
