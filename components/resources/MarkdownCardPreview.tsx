"use client";
import { useEffect, useRef } from "react";
import { ArrowUpRight, FileCode2 } from "lucide-react";

export default function MarkdownCardPreview({ fileName, content, active }: { fileName: string; content: string; active: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLPreElement>(null);
  const lines = content.slice(0, 6000).split("\n").slice(0, 80);
  useEffect(() => {
    const frame = viewport.current, code = source.current;
    if (!active || !frame || !code) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    let visible = true;
    function sync() {
      if (!visible || document.hidden || reduced.matches) { animation?.pause(); return; }
      if (!animation) {
        const distance = Math.max(0, code!.scrollHeight - frame!.clientHeight);
        if (!distance) return;
        animation = code!.animate([{ transform: "translateY(0)" }, { transform: `translateY(-${distance}px)` }], {
          duration: Math.max(1800, distance / 30 * 1000), delay: 450, easing: "linear", fill: "forwards",
        });
      } else animation.play();
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(frame);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { animation?.cancel(); observer.disconnect(); reduced.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [active, content]);
  return <div className="resource-document-preview">
    <div className="resource-code-titlebar"><FileCode2 size={15} aria-hidden="true"/><span>{fileName}</span><span className="resource-code-language">Markdown</span></div>
    <div className="resource-code-viewport" ref={viewport} aria-hidden="true">
      <pre ref={source}>{lines.map((line, index) => <span className={`resource-code-line${/^#{1,6}\s/.test(line) ? " resource-code-heading" : /^\s*[-*]\s/.test(line) ? " resource-code-item" : /^```/.test(line) ? " resource-code-fence" : ""}`} key={index}><span className="resource-code-number">{index + 1}</span><span>{line || " "}</span></span>)}</pre>
    </div>
    <span className="resource-code-hint">Prévia do arquivo <ArrowUpRight size={13} aria-hidden="true"/></span>
  </div>;
}
