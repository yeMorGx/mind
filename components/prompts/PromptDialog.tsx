"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Prompt } from "@/lib/firebase/data";

type PromptDialogProps = {
  isOpen: boolean;
  prompt: Prompt | null;
  initialTitle?: string;
  pending: boolean;
  error: string;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
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
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSave(title, content);
              }}
              className="my-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#080808] p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="prompt-dialog-title" className="text-2xl font-semibold">
                    {prompt ? "Edit prompt" : "New prompt"}
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    Salve um título e o conteúdo que você quer guardar.
                  </p>
                </div>
                <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-white/50 hover:bg-white/5 hover:text-white">
                  Fechar
                </button>
              </div>

              <label htmlFor="prompt-title" className="mt-6 block text-sm text-white/60">
                Title
              </label>
              <input
                id="prompt-title"
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Product launch announcement"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-white/30"
              />

              <label htmlFor="prompt-content" className="mt-5 block text-sm text-white/60">
                Prompt
              </label>
              <textarea
                id="prompt-content"
                required
                rows={9}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write or paste your prompt..."
                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-white/30"
              />

              {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-5 py-3 text-white/70 hover:bg-white/5">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !title.trim() || !content.trim()}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "Saving..." : prompt ? "Save changes" : "Save prompt"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
