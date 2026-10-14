"use client";

import { useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import CircularGallery from "@/components/ui/CircularGallery";
import type { Prompt } from "@/lib/supabase/types";

export default function LandingGallery({ prompts, suspended }: { prompts: Prompt[]; suspended: boolean }) {
  const [paused, setPaused] = useState(false);
  const items = useMemo(() => prompts.flatMap(prompt => prompt.images
    .filter(image => image.role === "gallery" || image.role === "after")
    .map(image => ({ image: image.url, alt: image.label || prompt.title }))).slice(0, 16), [prompts]);

  return <div className="relative mt-8 h-[300px] w-full sm:h-[380px] lg:h-[420px]">
    <CircularGallery items={items.length ? items : undefined} autoScroll={paused || suspended ? 0 : 0.65}
      showTitles={false} bend={2} itemSize={0.82} itemAspect={0.78} borderRadius={0.05} wave={0.3} dpr={1} intro={false} />
    <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Retomar rotação da galeria" : "Pausar rotação da galeria"}
      aria-pressed={paused} className="absolute bottom-3 right-5 grid size-9 place-items-center rounded-full border border-border bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:hidden">
      {paused ? <Play size={15} /> : <Pause size={15} />}
    </button>
  </div>;
}
