"use client";

// Adapted from Bencho Upload dropzone (MIT): https://bencho.dev/licence
// The original demo simulated files. This version accepts real browser files;
// progress describes processing, and persistence happens when the prompt is saved.
import { useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Check, LoaderCircle, Upload } from "lucide-react";

export function UploadDropzone({ onFiles, disabled = false, remaining = 8 }: {
  onFiles: (files: File[]) => Promise<void>;
  disabled?: boolean;
  remaining?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [over, setOver] = useState(false);
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [error, setError] = useState("");
  const shake = useAnimationControls();
  const still = useReducedMotion();
  const locked = disabled || phase === "processing" || remaining <= 0;

  async function accept(files: File[]) {
    if (disabled || busy.current || remaining <= 0 || !files.length) return;
    busy.current = true;
    setError("");
    setPhase("processing");
    try {
      if (files.length > remaining) throw new Error(`Você pode adicionar mais ${remaining} imagem(ns).`);
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use imagens JPEG, PNG ou WebP.");
        if (file.size > 5 * 1024 * 1024) throw new Error(`A imagem ${file.name} ultrapassa 5 MB.`);
      }
      await onFiles(files);
      setPhase("done");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível adicionar as imagens.");
      setPhase("idle");
      if (!still) void shake.start({ x: [0, -5, 5, -3, 3, 0], transition: { duration: 0.3 } });
    } finally { busy.current = false; }
  }

  return <div className="mind-upload">
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} disabled={locked}
      onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void accept(files); }} />
    <motion.div animate={shake}>
      {/* A slot of fixed size, so the box can react to a file
          without moving anything below it. The original's 176px
          target reads as a place to put something, not a banner. */}
      <button type="button" className="mind-upload-zone" data-over={over || undefined} disabled={locked}
        onClick={() => input.current?.click()}
        onDragOver={(event) => { event.preventDefault(); if (!locked) setOver(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}
        onDrop={(event) => { event.preventDefault(); setOver(false); if (!locked) void accept(Array.from(event.dataTransfer.files)); }}>
        <span className="mind-upload-icon">{phase === "processing" ? <LoaderCircle size={20} className="motion-safe:animate-spin" /> : phase === "done" ? <Check size={20} /> : <Upload size={20} />}</span>
        <strong>{phase === "processing" ? "Preparando suas imagens…" : remaining <= 0 ? "Limite de imagens atingido" : over ? "Solte as imagens aqui" : "Arraste imagens ou clique para selecionar"}</strong>
        <span>JPEG, PNG ou WebP · até 5 MB por arquivo</span>
      </button>
    </motion.div>
    {error && <p role="alert" className="mt-2 text-sm text-red-200">{error}</p>}
    {phase === "done" && <p role="status" className="mt-2 text-xs text-white/50">Imagens preparadas. Salve o prompt para guardar as alterações.</p>}
  </div>;
}
