"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
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
 const { t, intlLocale } = useI18n();

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
      .sort(([a, first], [b, second]) => second.count - first.count || a.localeCompare(b, intlLocale))
      .slice(0, 6)
      .map(([text, group]) => ({ category: text, text: t(text), image: group.image, link: `/explore?category=${encodeURIComponent(text)}`, meta: t("Explorar") }));
  }, [prompts, intlLocale, t]);

  if (!items.length) return null;

  return <section className="explore-categories" aria-labelledby="explore-categories-title">
    <div className="explore-categories-heading">
      <h2 id="explore-categories-title">{t("Explore por categoria")}</h2>
      <p>{t("Outro caminho para encontrar seu próximo prompt.")}</p>
    </div>
    <FlowingMenu
      items={items}
      activeIndex={items.findIndex(item => item.category === selected)}
      onItemClick={(_item, index) => onSelect(items[index].category)}
      ariaLabel={t("Categorias de prompts")}
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
