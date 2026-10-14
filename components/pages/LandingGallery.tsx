"use client";

import { useMemo } from "react";
import CircularGallery from "@/components/ui/CircularGallery";
import type { Prompt } from "@/lib/supabase/types";

export default function LandingGallery({ prompts, suspended }: { prompts: Prompt[]; suspended: boolean }) {
  const items = useMemo(() => prompts.flatMap(prompt => prompt.images
    .filter(image => image.role === "gallery" || image.role === "after")
    .map(image => ({ image: image.url, alt: image.label || prompt.title }))).slice(0, 16), [prompts]);

  return <div className="relative mt-8 h-[300px] w-full sm:h-[380px] lg:h-[420px]">
    <CircularGallery items={items.length ? items : undefined} autoScroll={suspended ? 0 : 0.65}
      showTitles={false} bend={2} itemSize={0.82} itemAspect={0.78} borderRadius={0.05} wave={0.3} dpr={1} intro={false} />
  </div>;
}
