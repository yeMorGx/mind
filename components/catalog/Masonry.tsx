"use client";

import { Children, isValidElement, useLayoutEffect, useRef, type ReactNode } from "react";
import "./Masonry.css";

/** Adapted from the supplied React Bits Masonry: place each tile in the shortest
 * column. Measure the complete existing card, including its creator details,
 * rather than replacing the card with a standalone image/lightbox. */
export default function Masonry({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const shown = useRef(new WeakSet<HTMLElement>());
  const entries = Children.toArray(children);

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const tiles = Array.from(container.children) as HTMLElement[];
    const revealed = shown.current;
    let frame = 0;
    let disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const reveal = new IntersectionObserver(changes => {
      for (const entry of changes) {
        if (!entry.isIntersecting || revealed.has(entry.target as HTMLElement)) continue;
        const tile = entry.target as HTMLElement;
        revealed.add(tile);
        reveal.unobserve(tile);
        if (reduced.matches) continue;
        const content = tile.firstElementChild as HTMLElement;
        const animation = content.animate(
          [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 450, easing: "cubic-bezier(0.2,0.9,0.2,1)" },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    }, { threshold: 0.05 });

    function layout() {
      frame = 0;
      if (disposed || !container || !container.clientWidth) return;
      const styles = getComputedStyle(container);
      const columns = Number(styles.getPropertyValue("--masonry-columns")) || 1;
      const gap = parseFloat(styles.columnGap) || 28;
      const rowGap = parseFloat(styles.rowGap) || 30;
      const width = (container.clientWidth - gap * (columns - 1)) / columns;
      const heights = new Array<number>(columns).fill(0);
      // Set widths together before measuring to avoid repeated read/write layout.
      tiles.forEach(tile => { tile.style.width = `${width}px`; });
      const sizes = tiles.map(tile => (tile.firstElementChild as HTMLElement).getBoundingClientRect().height);
      tiles.forEach((tile, index) => {
        const column = heights.indexOf(Math.min(...heights));
        const x = column * (width + gap), y = heights[column];
        tile.style.transform = `translate3d(${x}px,${y}px,0)`;
        heights[column] += sizes[index] + rowGap;
      });
      container.style.height = `${Math.max(0, ...heights) - (tiles.length ? rowGap : 0)}px`;
      container.dataset.ready = "true";
      tiles.forEach(tile => { if (!revealed.has(tile)) reveal.observe(tile); });
    }
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(layout); };
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    tiles.forEach(tile => { if (tile.firstElementChild) observer.observe(tile.firstElementChild); });
    layout();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      reveal.disconnect();
      animations.forEach(animation => animation.cancel());
    };
  }, [children]);

  return <div ref={root} className="catalog-grid explore-masonry">
    {entries.map((child, index) => <div className="explore-masonry-item" key={isValidElement(child) ? child.key ?? index : index}>
      <div className="explore-masonry-content">{child}</div>
    </div>)}
  </div>;
}
