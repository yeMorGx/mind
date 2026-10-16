"use client";

import { useMemo } from "react";
import FlowingMenu from "@/components/ui/FlowingMenu";
import { catalogCategory } from "@/lib/catalog";
import type { Prompt } from "@/lib/supabase/types";
import "./ExploreCategories.css";

export default function ExploreCategories({ prompts, selected, onSelect }: {
  prompts: Prompt[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  const items = useMemo(() => {
    const groups = new Map<string, { count: number; image?: string }>();
    for (const prompt of prompts) {
      const name = catalogCategory(prompt);
      const group = groups.get(name) ?? { count: 0 };
      group.count++;
      group.image ||= prompt.images.find(image => image.role === "gallery" || image.role === "after")?.url;
      groups.set(name, group);
    }
    return [...groups.entries()]
      .sort(([a, first], [b, second]) => second.count - first.count || a.localeCompare(b, "pt-BR"))
      .slice(0, 6)
      .map(([text, group]) => ({ text, image: group.image, link: `/explore?category=${encodeURIComponent(text)}`, meta: "Explorar" }));
  }, [prompts]);

  if (!items.length) return null;

  return <section className="explore-categories" aria-labelledby="explore-categories-title">
    <div className="explore-categories-heading">
      <h2 id="explore-categories-title">Explore por categoria</h2>
      <p>Outro caminho para encontrar seu próximo prompt.</p>
    </div>
    <FlowingMenu
      items={items}
      activeIndex={items.findIndex(item => item.text === selected)}
      onItemClick={item => onSelect(item.text)}
      ariaLabel="Categorias de prompts"
      align="left"
      showArrow
      intro={false}
      speed={45}
      followCursor={0.15}
      stretch={0.35}
      magnet={0.1}
      direction="alternate"
      textColor="var(--foreground)"
      bgColor="transparent"
      borderColor="var(--border-color)"
      marqueeBgColor="var(--surface-hover)"
      marqueeTextColor="var(--foreground)"
      style={{ height: `calc(${items.length} * var(--category-row-height))` }}
    />
  </section>;
}
