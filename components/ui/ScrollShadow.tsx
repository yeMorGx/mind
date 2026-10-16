"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function ScrollShadow({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const update = () => { const next = { top: element.scrollTop > 2, bottom: element.scrollHeight - element.clientHeight - element.scrollTop > 2 }; setEdges(previous => previous.top === next.top && previous.bottom === next.bottom ? previous : next); };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [children]);
  return <div className="scroll-shadow" data-top={edges.top || undefined} data-bottom={edges.bottom || undefined}><div ref={root} className={`scroll-shadow-viewport ${className}`} tabIndex={0} role="region" aria-label={label}>{children}</div></div>;
}
