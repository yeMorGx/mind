"use client";

import { useRef, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import type { PromptImage } from "@/lib/supabase/types";

export default function PromptReferences({ images }: { images: PromptImage[] }) {
  return <section className="prompt-detail-references" aria-labelledby="references-heading">
    <h2 id="references-heading">{images.length === 1 ? "Imagem de referência" : "Imagens de referência"}</h2>
    <p>Baixe e anexe na IA junto com o prompt. Use a ordem indicada abaixo ao mencionar cada imagem.</p>
    <div>{images.map((image, index) => <ReferenceImage key={image.id} image={image} position={index + 1} />)}</div>
  </section>;
}

function ReferenceImage({ image, position }: { image: PromptImage; position: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [failedPreview, setFailedPreview] = useState(false);
  const busy = useRef(false);

  async function download() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(image.url, { credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error("Download indisponível");
      const blob = await response.blob();
      const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[blob.type.split(";")[0]];
      if (!extension || !blob.size) throw new Error("Arquivo inválido");
      const name = image.label.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[^\p{L}\p{N}_ -]/gu, "").trim().slice(0, 80);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `referencia-${position}${name ? `-${name}` : ""}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Keep the object URL alive long enough for Safari to start the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError("Não foi possível baixar. Confira sua conexão e tente novamente.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return <figure>
    {failedPreview ? <div className="prompt-reference-unavailable">Prévia indisponível</div> :
      // eslint-disable-next-line @next/next/no-img-element -- Supports optimized data URLs and published storage URLs.
      <img src={image.url} alt={image.label || `Referência ${position} do prompt`} loading="lazy" onError={() => setFailedPreview(true)} />}
    <figcaption><strong>Referência {position}</strong>{image.label && <span>{image.label}</span>}</figcaption>
    <button type="button" className="workflow-button secondary" disabled={pending} onClick={() => void download()} aria-label={`Baixar referência ${position}`}>
      {pending ? <LoaderCircle size={16} className="motion-safe:animate-spin" /> : <Download size={16} />}
      {pending ? "Baixando…" : "Baixar referência"}
    </button>
    {error && <p role="alert" className="prompt-reference-error">{error}</p>}
  </figure>;
}
