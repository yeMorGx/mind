"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Maximize2, Pause, Play, X } from "lucide-react";

type ResultImage = { id: string; url: string; label: string };

function subscribeToVisibility(listener: () => void) {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}

function ResultTile({ image, index, duplicate, onOpen }: {
  image: ResultImage; index: number; duplicate: boolean; onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return <button type="button" className="results-marquee-card" tabIndex={duplicate ? -1 : 0}
    aria-label={`Ampliar resultado ${index + 1}${image.label ? `: ${image.label}` : ""}`}
    onMouseDown={duplicate ? (event) => event.preventDefault() : undefined} onClick={onOpen}>
    <span className="results-marquee-media">
      {/* eslint-disable-next-line @next/next/no-img-element -- Real optimized data URLs and signed image URLs. */}
      {failed ? <span className="results-marquee-error">Imagem indisponível</span> : <img src={image.url} alt={duplicate ? "" : image.label || `Resultado ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />}
      <span className="results-marquee-expand" aria-hidden="true"><Maximize2 size={15} /></span>
    </span>
    <span className="results-marquee-caption" title={image.label}>{image.label || `Resultado ${index + 1}`}</span>
  </button>;
}

export default function ResultsMarquee({ images }: { images: ResultImage[] }) {
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const pageVisible = useSyncExternalStore(subscribeToVisibility, () => document.visibilityState === "visible", () => true);
  const multiple = images.length > 1;
  const selected = active === null ? null : images[active];
  const opened = active !== null;
  const running = multiple && inView && pageVisible && !paused && !hovered && !opened;

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const intersection = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    intersection.observe(element);
    // Each copy must fill at least the visible width: a short gallery must
    // not leave a gap as the second identical group takes over the loop.
    const resize = new ResizeObserver(([entry]) => {
      element.style.setProperty("--results-width", `${entry.contentRect.width}px`);
      const group = element.querySelector<HTMLElement>(".results-marquee-group");
      element.style.setProperty("--results-duration", `${Math.max(20, (group?.offsetWidth ?? entry.contentRect.width) / 28)}s`);
    });
    resize.observe(element);
    return () => { intersection.disconnect(); resize.disconnect(); };
  }, [images.length]);

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
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-white/50">{images.length} {images.length === 1 ? "imagem" : "imagens"}</span>
        {multiple && <button type="button" className="results-marquee-pause" aria-label={paused ? "Retomar movimento dos resultados" : "Pausar movimento dos resultados"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          {paused ? <Play size={14} /> : <Pause size={14} />}<span>{paused ? "Retomar" : "Pausar"}</span>
        </button>}
      </div>
    </div>
    <div ref={viewport} className="results-marquee-viewport" onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }} onPointerLeave={() => setHovered(false)}>
      <div className="results-marquee-track" style={{ animationPlayState: running ? "running" : "paused" } as CSSProperties}>
        {[false, ...(multiple ? [true] : [])].map((duplicate) => <div key={String(duplicate)} className={`results-marquee-group${duplicate ? " results-marquee-copy" : ""}`} aria-hidden={duplicate || undefined}>
          {images.map((image, index) => <ResultTile key={image.id} image={image} index={index} duplicate={duplicate} onOpen={() => setActive(index)} />)}
        </div>)}
      </div>
    </div>
    <p className="mt-3 text-xs text-white/50">Clique em uma imagem para ver o resultado completo.</p>

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
