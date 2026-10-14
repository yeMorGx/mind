"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, X } from "lucide-react";
import { ImageCompare } from "@/components/ui/ImageCompare";
import type { Prompt, PromptDraft, PromptImageInput, PromptImageRole, PromptStatus } from "@/lib/supabase/types";

/* eslint-disable @next/next/no-img-element -- The editor previews local blob URLs before upload. */

type PromptDialogProps = {
  isOpen: boolean;
  prompt: Prompt | null;
  initialTitle?: string;
  pending: boolean;
  error: string;
  onClose: () => void;
  onSave: (draft: PromptDraft) => void;
};

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

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
  const [category, setCategory] = useState(prompt?.category ?? "");
  const [model, setModel] = useState(prompt?.model ?? "");
  const [images, setImages] = useState<PromptImageInput[]>(() =>
    prompt?.images.map((image) => ({ ...image })) ?? [],
  );
  const [localError, setLocalError] = useState("");
  const objectUrls = useRef(new Set<string>());

  useEffect(() => () => {
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
    objectUrls.current.clear();
  }, []);

  function removeImage(image: PromptImageInput) {
    if (image.url?.startsWith("blob:")) {
      URL.revokeObjectURL(image.url);
      objectUrls.current.delete(image.url);
    }
    setImages((current) => current.filter((item) => item !== image));
  }

  function addImages(files: FileList | null, role: PromptImageRole) {
    if (!files?.length) return;
    setLocalError("");
    const selected = Array.from(files);
    if (role === "gallery" && images.filter((image) => image.role === "gallery").length + selected.length > 8) {
      setLocalError("O carrossel aceita até 8 imagens.");
      return;
    }
    if (role !== "gallery" && selected.length > 1) {
      setLocalError("Escolha apenas uma imagem neste campo.");
      return;
    }
    const invalid = selected.find((file) => !acceptedImageTypes.has(file.type) || file.size > 20 * 1024 * 1024);
    if (invalid) {
      setLocalError(!acceptedImageTypes.has(invalid.type)
        ? "Use imagens JPG, PNG, WebP ou AVIF."
        : "Cada imagem pode ter no máximo 20 MB.");
      return;
    }

    const additions = selected.map((file) => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { file, url, role, label: file.name, position: images.length };
    });
    setImages((current) => [
      ...current.filter((image) => role === "gallery" || image.role !== role),
      ...additions,
    ]);
  }

  function save(status: PromptStatus) {
    setLocalError("");
    if (!title.trim() || !content.trim()) {
      setLocalError("Preencha o título e o conteúdo do prompt.");
      return;
    }
    if (status === "published" && !images.some((image) => image.role === "gallery" || image.role === "after")) {
      setLocalError("Adicione pelo menos uma imagem de resultado para publicar.");
      return;
    }
    const draft: PromptDraft = {
      title,
      content,
      description,
      category,
      model,
      status,
      images: images.map((image, position) => ({ ...image, position })),
    };
    onSave(draft);
  }

  const before = images.find((image) => image.role === "before");
  const after = images.find((image) => image.role === "after");

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
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-dialog-title"
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); save(prompt?.status ?? "draft"); }}
              className="my-auto w-full max-w-4xl rounded-3xl border border-border bg-surface p-5 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-subtle">Publicação</p>
                  <h2 id="prompt-dialog-title" className="mt-2 text-2xl font-semibold">
                    {prompt ? "Editar prompt" : "Novo prompt"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">Mostre o resultado e compartilhe o prompt com seus seguidores.</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full border border-border p-2 text-muted hover:bg-foreground/5 hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(250px,.8fr)]">
                <div>
                  <label htmlFor="prompt-title" className="block text-sm text-muted">Título</label>
                  <input id="prompt-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Retrato editorial com luz de estúdio" className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" />

                  <label htmlFor="prompt-description" className="mt-5 block text-sm text-muted">Sobre o resultado</label>
                  <textarea id="prompt-description" rows={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explique o estilo, os ajustes ou como você usou este prompt." className="mt-2 w-full resize-y rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" />

                  <label htmlFor="prompt-content" className="mt-5 block text-sm text-muted">Prompt</label>
                  <textarea id="prompt-content" required rows={9} maxLength={20000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Cole aqui o prompt completo para seus seguidores copiarem." className="mt-2 w-full resize-y rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-foreground/30" />

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-muted">Categoria
                      <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-foreground/30">
                        <option value="">Escolha uma categoria</option>
                        <option>Arte</option><option>Retrato</option><option>Moda</option><option>Produto</option><option>Vídeo</option><option>Outro</option>
                      </select>
                    </label>
                    <label htmlFor="prompt-model" className="text-sm text-muted">Ferramenta ou modelo
                      <input id="prompt-model" maxLength={80} value={model} onChange={(event) => setModel(event.target.value)} placeholder="Ex.: Midjourney, Flux, Sora" className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" />
                    </label>
                  </div>
                </div>

                <aside className="space-y-6">
                  <section>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">Resultados para o carrossel</h3>
                        <p className="mt-1 text-xs leading-5 text-subtle">Até 8 imagens · JPG, PNG, WebP ou AVIF · 20 MB cada</p>
                      </div>
                      <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted hover:bg-foreground/5">
                        <ImagePlus size={15} /> Adicionar
                        <input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { addImages(event.target.files, "gallery"); event.currentTarget.value = ""; }} />
                      </label>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {images.filter((image) => image.role === "gallery").map((image) => (
                        <ImageTile key={image.id ?? image.url} image={image} onRemove={() => removeImage(image)} />
                      ))}
                      {!images.some((image) => image.role === "gallery") && <div className="col-span-2 rounded-xl border border-dashed border-border p-5 text-center text-xs text-subtle">Adicione exemplos do que este prompt gera.</div>}
                    </div>
                  </section>

                  <ImageUploadSection title="Imagem de referência (opcional)" image={images.find((item) => item.role === "reference")} onAdd={(files) => addImages(files, "reference")} onRemove={(image) => removeImage(image)} />

                  <section>
                    <h3 className="text-sm font-medium">Antes e depois (opcional)</h3>
                    <p className="mt-1 text-xs leading-5 text-subtle">As duas imagens aparecem em um comparador interativo na publicação.</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <ImageUploadSection compact title="Antes" image={before} onAdd={(files) => addImages(files, "before")} onRemove={(image) => removeImage(image)} />
                      <ImageUploadSection compact title="Depois" image={after} onAdd={(files) => addImages(files, "after")} onRemove={(image) => removeImage(image)} />
                    </div>
                    {before?.url && after?.url && (
                      <div className="mt-3 overflow-hidden rounded-xl">
                        <ImageCompare beforeSrc={before.url} afterSrc={after.url} beforeAlt="Antes" afterAlt="Depois" aspectRatio={4 / 3} />
                      </div>
                    )}
                  </section>

                  <div className="rounded-xl border border-border bg-foreground/[0.025] p-4 text-xs leading-5 text-subtle">
                    <strong className="font-medium text-muted">Ao publicar</strong>, qualquer pessoa poderá ver a página e copiar o prompt sem criar uma conta. Você pode salvar como rascunho enquanto prepara as imagens.
                  </div>
                </aside>
              </div>

              {(localError || error) && <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-700">{localError || error}</p>}

              <div className="mt-7 flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
                <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-3 text-muted hover:bg-foreground/5">Cancelar</button>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button type="button" disabled={pending || !title.trim() || !content.trim()} onClick={() => save("draft")} className="rounded-xl border border-border px-5 py-3 text-foreground disabled:opacity-50">
                    {pending ? "Salvando…" : "Salvar rascunho"}
                  </button>
                  <button type="button" disabled={pending || !title.trim() || !content.trim()} onClick={() => save("published")} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">
                    {pending ? "Salvando…" : prompt?.status === "published" ? "Salvar publicação" : "Publicar prompt"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ImageUploadSection({
  title,
  image,
  onAdd,
  onRemove,
  compact = false,
}: {
  title: string;
  image?: PromptImageInput;
  onAdd: (files: FileList | null) => void;
  onRemove: (image: PromptImageInput) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "min-w-0" : ""}>
      <p className="text-xs text-muted">{title}</p>
      {image?.url ? (
        <ImageTile image={image} onRemove={() => onRemove(image)} compact={compact} />
      ) : (
        <label className="mt-2 flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-2 py-4 text-center text-xs text-subtle hover:bg-foreground/[0.03]">
          <ImagePlus size={17} />
          <span>{compact ? "Adicionar" : "Selecionar imagem"}</span>
          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { onAdd(event.target.files); event.currentTarget.value = ""; }} />
        </label>
      )}
    </div>
  );
}

function ImageTile({ image, onRemove, compact = false }: { image: PromptImageInput; onRemove: () => void; compact?: boolean }) {
  return (
    <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-foreground/[0.03]">
      <img src={image.url} alt={image.label || "Prévia da imagem selecionada"} className="aspect-[4/3] w-full object-cover" />
      <button type="button" aria-label={`Remover ${image.label || "imagem"}`} onClick={onRemove} className="absolute right-2 top-2 rounded-full bg-black/75 p-1.5 text-white hover:bg-black">
        <X size={14} />
      </button>
      {!compact && <p className="truncate px-2 py-1.5 text-[11px] text-subtle">{image.label || "Imagem"}</p>}
    </div>
  );
}
