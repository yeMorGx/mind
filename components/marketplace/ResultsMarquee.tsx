"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

type ResultImage = { id: string; url: string; label: string };

function ResultTile({ image, index, onOpen }: {
  image: ResultImage; index: number; onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return <button type="button" className="results-marquee-card"
    aria-label={`Ampliar resultado ${index + 1}${image.label ? `: ${image.label}` : ""}`}
    onClick={onOpen}>
    <span className="results-marquee-media">
      {/* eslint-disable-next-line @next/next/no-img-element -- Real optimized data URLs and signed image URLs. */}
      {failed ? <span className="results-marquee-error">Imagem indisponível</span> : <img src={image.url} alt={image.label || `Resultado ${index + 1}`} draggable={false} loading={index === 0 ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />}
    </span>
  </button>;
}

export default function ResultsMarquee({ images }: { images: ResultImage[] }) {
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ id: number; x: number; scrollLeft: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [active, setActive] = useState<number | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const multiple = images.length > 1;
  const selected = active === null ? null : images[active];
  const opened = active !== null;
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (opened && !element.open) element.showModal();
    if (!opened && element.open) element.close();
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [opened]);

  function step(direction: number) {
    setActive((index) => index === null ? null : (index + direction + images.length) % images.length);
  }

  return <section className="results-marquee mt-9" aria-labelledby="prompt-results-heading" data-single={!multiple || undefined}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id="prompt-results-heading" className="text-sm font-medium text-white/75">Resultados do prompt</h2>
    </div>
    <div className="results-marquee-viewport" data-dragging={dragging || undefined}
      role="region" aria-label="Galeria de resultados do prompt" tabIndex={multiple ? 0 : undefined}
      onPointerDown={event => {
        suppressClick.current = false;
        if (event.pointerType === "touch" || event.button !== 0 || !multiple) return;
        gesture.current = { id: event.pointerId, x: event.clientX, scrollLeft: event.currentTarget.scrollLeft, moved: false };
      }}
      onPointerMove={event => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        if (event.buttons !== 1) { gesture.current = null; setDragging(false); return; }
        const distance = event.clientX - current.x;
        if (!current.moved && Math.abs(distance) < 6) return;
        if (!current.moved) {
          current.moved = true; suppressClick.current = true; setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
        event.currentTarget.scrollLeft = current.scrollLeft - distance;
      }}
      onPointerUp={event => {
        if (gesture.current?.id !== event.pointerId) return;
        gesture.current = null; setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerLeave={() => { if (!gesture.current?.moved) gesture.current = null; }}
      onPointerCancel={() => { gesture.current = null; setDragging(false); }}
      onLostPointerCapture={() => { gesture.current = null; setDragging(false); }}
      onClickCapture={event => {
        if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      }}
      onDragStart={event => event.preventDefault()}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        event.currentTarget.scrollBy({ left: event.currentTarget.clientWidth * (event.key === "ArrowLeft" ? -0.8 : 0.8) });
      }}>
      <div className="results-marquee-track">
        <div className="results-marquee-group">
          {images.map((image, index) => <ResultTile key={image.id} image={image} index={index} onOpen={() => setActive(index)} />)}
        </div>
      </div>
    </div>
    <p className="mt-3 text-xs text-white/50">{multiple ? "Arraste para explorar. Clique em uma imagem para ver o resultado completo." : "Clique na imagem para ver o resultado completo."}</p>

    <dialog ref={dialog} className="results-lightbox" aria-labelledby="result-viewer-title" onCancel={(event) => { event.preventDefault(); setActive(null); }} onClose={() => setActive(null)}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setActive(null);
      }} onKeyDown={(event) => { if (multiple && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); step(event.key === "ArrowLeft" ? -1 : 1); } }}>
      {selected && <>
        <div className="results-lightbox-header"><h2 id="result-viewer-title">{selected.label || `Resultado ${(active ?? 0) + 1}`}</h2><button type="button" aria-label="Fechar imagem ampliada" onClick={() => setActive(null)}><X size={20} /></button></div>
        <div className="results-lightbox-image">
          {failedImage === selected.id ? <p role="alert">Imagem indisponível. Recarregue a página para tentar novamente.</p> : (
            /* eslint-disable-next-line @next/next/no-img-element -- View the exact selected uploaded or signed image. */
            <img src={selected.url} alt={selected.label || `Resultado ${(active ?? 0) + 1}`} onError={() => setFailedImage(selected.id)} />
          )}
        </div>
        <div className="results-lightbox-footer">
          {multiple && <button type="button" aria-label="Resultado anterior" onClick={() => step(-1)}><ArrowLeft size={18} /></button>}
          <span aria-live="polite">{(active ?? 0) + 1} / {images.length}</span>
          {multiple && <button type="button" aria-label="Próximo resultado" onClick={() => step(1)}><ArrowRight size={18} /></button>}
        </div>
      </>}
    </dialog>
  </section>;
}
