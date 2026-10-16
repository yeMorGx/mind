"use client";

import { useEffect, useRef, useState } from "react";

/** Finite, two-phase pixel wipe, inspired by React Bits Pixel Transition. */
export default function PixelImage({ src, alt, onError, onSize }: {
  src: string; alt: string; onError: () => void; onSize?: (width: number, height: number) => void;
}) {
  const [displayed, setDisplayed] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const current = useRef(src);
  const overlay = useRef<HTMLSpanElement>(null);
  const error = useRef(onError);
  useEffect(() => { error.current = onError; }, [onError]);

  useEffect(() => {
    if (current.current === src) return;
    let alive = true;
    const layer = overlay.current;
    let swap: ReturnType<typeof setTimeout> | undefined;
    let finish: ReturnType<typeof setTimeout> | undefined;
    const animations: Animation[] = [];
    const image = new Image();
    image.onload = () => {
      if (!alive) return;
      const change = () => { current.current = src; setDisplayed(src); };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !layer || document.hidden) { change(); return; }
      layer.replaceChildren(...Array.from({ length: 96 }, () => document.createElement("span")));
      layer.dataset.running = "true";
      layer.querySelectorAll<HTMLElement>("span").forEach((tile, index) => {
        const delay = ((index * 37) % 97) * 1.5;
        animations.push(tile.animate([{ opacity: 0 }, { opacity: 1, offset: 0.28 }, { opacity: 1, offset: 0.62 }, { opacity: 0 }], {
          duration: 500, delay, easing: "steps(1, end)", fill: "both",
        }));
      });
      swap = setTimeout(change, 300);
      finish = setTimeout(() => { if (layer) { delete layer.dataset.running; layer.replaceChildren(); } animations.forEach(animation => animation.cancel()); }, 680);
    };
    image.onerror = () => { if (alive) error.current(); };
    image.src = src;
    return () => { alive = false; image.onload = null; image.onerror = null; clearTimeout(swap); clearTimeout(finish); animations.forEach(animation => animation.cancel()); if (layer) { delete layer.dataset.running; layer.replaceChildren(); } };
  }, [src]);

  return <div className="pixel-image" data-loaded={loaded || undefined}>
    {!loaded && <span className="image-skeleton" aria-hidden="true"/>}
    {/* eslint-disable-next-line @next/next/no-img-element -- Exact uploaded image, including data URLs. */}
    <img src={displayed} alt={alt} draggable={false} loading="lazy" decoding="async" onLoad={event => { setLoaded(true); onSize?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight); }} onError={onError}/>
    <span ref={overlay} className="pixel-image-mask" aria-hidden="true"/>
  </div>;
}
