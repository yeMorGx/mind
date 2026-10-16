"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { NavigationMenu } from "radix-ui";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Compass, ImageIcon, Library, ScanFace, Star, Layers, Plus } from "lucide-react";

export default function SiteNavigation({ explore, library, favorites, onExplore, onLibrary, onCreate }: {
  explore: boolean; library: boolean; favorites: boolean;
  onExplore: () => void; onLibrary: (favorites: boolean) => void; onCreate: () => void;
}) {
  const group = useId();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState("");
  const close = () => setOpen("");
  const mobileItems = [
    { id: "explore", label: "Explorar", icon: Compass, active: explore },
    { id: "library", label: "Biblioteca", icon: Library, active: library && !favorites },
    { id: "favorites", label: "Favoritos", icon: Star, active: library && favorites },
  ];
  return <>
    <NavigationMenu.Root className="showcase-nav desktop-site-navigation" aria-label="Navegação principal" value={open} onValueChange={setOpen} delayDuration={120}>
      <NavigationMenu.List className="site-nav-list">
        <NavigationMenu.Item value="explore">
          <NavigationMenu.Trigger className="site-nav-trigger" data-active={explore || undefined}>Explorar <ChevronDown size={14}/></NavigationMenu.Trigger>
          <NavigationMenu.Content className="site-nav-dropdown">
            <div className="site-nav-discover">
              <NavigationMenu.Link asChild><Link href="/explore" className="site-nav-feature" onClick={() => { close(); onExplore(); }}><Compass size={27} strokeWidth={1.5}/><strong>Uma ideia leva<br/>a outra.</strong><span>Explore os prompts da comunidade <ArrowUpRight size={17}/></span></Link></NavigationMenu.Link>
              <div className="site-nav-options">
                <NavigationMenu.Link asChild><Link href="/explore" onClick={() => { close(); onExplore(); }}><Layers size={19}/><span><strong>Todos os prompts</strong><small>Encontre sua próxima inspiração</small></span></Link></NavigationMenu.Link>
                <NavigationMenu.Link asChild><Link href="/explore?category=Imagem" onClick={close}><ImageIcon size={19}/><span><strong>Imagem</strong><small>Ideias que viram resultados visuais</small></span></Link></NavigationMenu.Link>
                <NavigationMenu.Link asChild><Link href="/explore?category=Retrato" onClick={close}><ScanFace size={19}/><span><strong>Retrato</strong><small>Explore estilos e personagens</small></span></Link></NavigationMenu.Link>
              </div>
            </div>
            <div className="site-nav-dropdown-foot">Uma comunidade para compartilhar o processo, além do resultado.</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="library">
          <NavigationMenu.Trigger className="site-nav-trigger" data-active={library || undefined}>Biblioteca <ChevronDown size={14}/></NavigationMenu.Trigger>
          <NavigationMenu.Content className="site-nav-dropdown site-nav-library">
            <div className="site-nav-options">
              <NavigationMenu.Link asChild><button type="button" onClick={() => { close(); onLibrary(false); }}><Library size={20}/><span><strong>Meus prompts</strong><small>Continue de onde você parou</small></span><ArrowUpRight size={16}/></button></NavigationMenu.Link>
              <NavigationMenu.Link asChild><button type="button" onClick={() => { close(); onLibrary(true); }}><Star size={20}/><span><strong>Favoritos</strong><small>As ideias que você quer guardar</small></span><ArrowUpRight size={16}/></button></NavigationMenu.Link>
              <NavigationMenu.Link asChild><button type="button" onClick={() => { close(); onCreate(); }}><Plus size={20}/><span><strong>Novo prompt</strong><small>Guarde uma ideia ou compartilhe com todos</small></span><ArrowUpRight size={16}/></button></NavigationMenu.Link>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
    <LayoutGroup id={group}><nav aria-label="Navegação no celular" className="showcase-nav mobile-site-navigation">
      {mobileItems.map(({ id, label, icon: Icon, active }) => {
        const content = <>{active && <motion.span className="site-nav-indicator" layoutId="active-page" aria-hidden="true" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 36 }}/>}
          <span className="site-nav-label"><Icon size={20} aria-hidden="true"/><span>{label}</span></span></>;
        return id === "explore"
          ? <Link key={id} href="/explore" onClick={onExplore} className="site-nav-item" aria-current={active ? "page" : undefined}>{content}</Link>
          : <button key={id} type="button" onClick={() => onLibrary(id === "favorites")} className="site-nav-item" aria-current={active ? "page" : undefined}>{content}</button>;
      })}
    </nav></LayoutGroup>
  </>;
}
