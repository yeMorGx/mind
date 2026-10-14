"use client";
import { useEffect, useRef } from "react";
import { Compass, Library, LogIn, LogOut, Star, UserRound, X, Tag, Cpu } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
export type PromptView = "all" | "favorites";
type SidebarProps = {
  pathname: string; activeView: PromptView; profileHref?: string; mobileOpen: boolean; onMobileClose: () => void;
  onLibrary: (view: PromptView) => void; onExplore: () => void; onLogin: () => void; onSignOut: () => void;
  categories: string[]; models: string[]; category: string; model: string; onCategoryChange: (value: string) => void; onModelChange: (value: string) => void;
};
export default function Sidebar({ pathname, activeView, profileHref, mobileOpen, onMobileClose, onLibrary, onExplore, onLogin, onSignOut, categories, models, category, model, onCategoryChange, onModelChange }: SidebarProps) {
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = drawer.current; if (!element) return;
    if (mobileOpen && !element.open) element.showModal();
    if (!mobileOpen && element.open) element.close();
    if (!mobileOpen) return;
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 768px)");
    const resize = () => { if (media.matches) onMobileClose(); }; media.addEventListener("change", resize);
    return () => { document.body.style.overflow = previous; media.removeEventListener("change", resize); };
  }, [mobileOpen, onMobileClose]);
  function navigation(mobile: boolean) {
    const item = (active: boolean) => `catalog-nav-item${active ? " is-active" : ""}`;
    return <>
      {mobile && <div className="mb-6 flex items-center justify-between px-1"><Link href="/explore" onClick={onMobileClose} className="flex items-center gap-2 text-xl font-semibold"><span className="catalog-logo"><Logo /></span>Mind</Link><button type="button" onClick={onMobileClose} aria-label="Fechar navegação" className="site-icon-button"><X size={20} /></button></div>}
      <nav aria-label="Navegação principal" className="space-y-1">
        <button type="button" onClick={() => onLibrary("all")} title="Meus prompts" aria-label="Meus prompts" aria-current={pathname === "/home" && activeView === "all" ? "page" : undefined} className={item(pathname === "/home" && activeView === "all")}><Library size={19} /><span className="catalog-nav-label">Meus prompts</span></button>
        <Link href="/explore" onClick={onExplore} title="Explorar" aria-label="Explorar" aria-current={pathname === "/explore" ? "page" : undefined} className={item(pathname === "/explore")}><Compass size={19} /><span className="catalog-nav-label">Explorar</span></Link>
        <button type="button" onClick={() => onLibrary("favorites")} title="Favoritos" aria-label="Favoritos" aria-current={pathname === "/home" && activeView === "favorites" ? "page" : undefined} className={item(pathname === "/home" && activeView === "favorites")}><Star size={19} /><span className="catalog-nav-label">Favoritos</span></button>
        {profileHref ? <Link href={profileHref} onClick={onMobileClose} title="Meu perfil" aria-label="Meu perfil" aria-current={pathname === profileHref ? "page" : undefined} className={item(pathname === profileHref)}><UserRound size={19} /><span className="catalog-nav-label">Meu perfil</span></Link> : <button type="button" onClick={() => { onMobileClose(); onLogin(); }} title="Entrar" aria-label="Entrar" className={item(false)}><LogIn size={19} /><span className="catalog-nav-label">Entrar na conta</span></button>}
      </nav>
      {categories.length > 0 && <nav aria-label="Categorias" className="catalog-nav-group"><p className="catalog-nav-heading">Categorias</p>{categories.map(value => <button key={value} type="button" title={value} aria-label={`Categoria: ${value}`} aria-pressed={category === value} onClick={() => onCategoryChange(category === value ? "" : value)} className={item(category === value)}><Tag size={17} /><span className="catalog-nav-label truncate">{value}</span></button>)}</nav>}
      {models.length > 0 && <nav aria-label="Modelos" className="catalog-nav-group"><p className="catalog-nav-heading">Modelos</p>{models.map(value => <button key={value} type="button" title={value} aria-label={`Modelo: ${value}`} aria-pressed={model === value} onClick={() => onModelChange(model === value ? "" : value)} className={item(model === value)}><Cpu size={17} /><span className="catalog-nav-label truncate">{value}</span></button>)}</nav>}
      {profileHref && <div className="mt-auto pt-8"><button type="button" title="Sair da conta" aria-label="Sair da conta" onClick={onSignOut} className={item(false)}><LogOut size={19} /><span className="catalog-nav-label">Sair da conta</span></button></div>}
    </>;
  }
  return <>
    <aside className="catalog-sidebar fixed bottom-0 left-0 top-18 z-30 hidden flex-col border-r border-border bg-surface md:flex">{navigation(false)}</aside>
    <dialog id="mobile-navigation" ref={drawer} className="site-navigation-drawer catalog-drawer" aria-label="Navegação do Mind" onCancel={event => { event.preventDefault(); onMobileClose(); }} onClose={onMobileClose}
      onClick={event => { if (event.target === event.currentTarget && event.clientX > event.currentTarget.getBoundingClientRect().right) onMobileClose(); }}>
      <div className="flex min-h-full flex-col p-4">{navigation(true)}</div>
    </dialog>
  </>;
}
