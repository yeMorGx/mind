"use client";

import { useId } from "react";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Compass, Library, Star } from "lucide-react";

export default function SiteNavigation({ explore, library, favorites, onExplore, onLibrary }: {
  explore: boolean; library: boolean; favorites: boolean;
  onExplore: () => void; onLibrary: (favorites: boolean) => void;
}) {
  const group = useId();
  const reduce = useReducedMotion();
  const items = [
    { id: "explore", label: "Explorar", icon: Compass, active: explore },
    { id: "library", label: "Biblioteca", icon: Library, active: library && !favorites },
    { id: "favorites", label: "Favoritos", icon: Star, active: library && favorites },
  ];
  return <LayoutGroup id={group}><nav aria-label="Navegação principal" className="showcase-nav">
    {items.map(({ id, label, icon: Icon, active }) => {
      const content = <>{active && <motion.span className="site-nav-indicator" layoutId="active-page" aria-hidden="true" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 36 }}/>}
        <span className="site-nav-label"><Icon size={17} aria-hidden="true"/><span>{label}</span></span></>;
      return id === "explore"
        ? <Link key={id} href="/explore" onClick={onExplore} className="site-nav-item" aria-current={active ? "page" : undefined}>{content}</Link>
        : <button key={id} type="button" onClick={() => onLibrary(id === "favorites")} className="site-nav-item" aria-current={active ? "page" : undefined}>{content}</button>;
    })}
  </nav></LayoutGroup>;
}
