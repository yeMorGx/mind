"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ImageCompare } from "@/components/ui/ImageCompare";

type SelectedImage = { src: string; name: string };

export default function ImageComparisonPanel() {
  const [before, setBefore] = useState<SelectedImage | null>(null);
  const [after, setAfter] = useState<SelectedImage | null>(null);
  const [error, setError] = useState("");
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => () => {
    if (before) URL.revokeObjectURL(before.src);
  }, [before]);
  useEffect(() => () => {
    if (after) URL.revokeObjectURL(after.src);
  }, [after]);

  function selectImage(event: ChangeEvent<HTMLInputElement>, side: "before" | "after") {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Escolha uma imagem JPG, PNG, WebP ou AVIF.");
      event.target.value = "";
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("A imagem precisa ter até 20 MB. Escolha um arquivo menor.");
      event.target.value = "";
      return;
    }
    setError("");
    const image = { src: URL.createObjectURL(file), name: file.name };
    if (side === "before") setBefore(image);
    else setAfter(image);
  }

  return (
    <details className="mb-10 border-y border-white/10 py-5">
      <summary className="cursor-pointer text-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
        Comparar imagens: antes e depois
      </summary>
      <p className="mt-3 max-w-2xl text-sm text-white/75">
        Escolha a imagem original e o resultado. Para comparar os detalhes, use imagens com o mesmo enquadramento.
      </p>
      <div key={inputKey} className="mt-5 grid gap-5 sm:grid-cols-2">
        {(["before", "after"] as const).map((side) => (
          <label key={side} className="block min-w-0 text-sm text-white/80">
            {side === "before" ? "Antes · imagem original" : "Depois · resultado"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => selectImage(event, side)}
              className="mt-2 block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-white/20 file:bg-white/5 file:px-3 file:py-2 file:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            />
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
      {before && after ? (
        <div className="mt-6 max-w-3xl">
          <ImageCompare
            key={`${before.src}-${after.src}`}
            beforeSrc={before.src}
            afterSrc={after.src}
            beforeAlt={`Original: ${before.name}`}
            afterAlt={`Resultado: ${after.name}`}
            onImageError={() => setError("Não foi possível abrir uma das imagens. Escolha outro arquivo.")}
          />
          <p className="mt-3 text-sm text-white/75">Arraste a divisória ou use as setas do teclado para comparar.</p>
        </div>
      ) : (
        <p role="status" className="mt-6 text-sm text-white/75">
          {before || after ? "Escolha a outra imagem para começar a comparação." : "JPG, PNG, WebP ou AVIF, até 20 MB por imagem."}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/65">As imagens ficam apenas nesta página; não são enviadas nem salvas.</p>
        {(before || after) && (
          <button type="button" onClick={() => {
            setBefore(null);
            setAfter(null);
            setError("");
            setInputKey((key) => key + 1);
          }} className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Limpar imagens
          </button>
        )}
      </div>
    </details>
  );
}
