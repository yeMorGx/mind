"use client";
import { useEffect, useRef } from "react";
import { Compass, Library, LogIn, LogOut, Star, UserRound, X } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
export type PromptView = "all" | "favorites";
type SidebarProps = { pathname: string; activeView: PromptView; profileHref?: string; userName: string; mobileOpen: boolean; onMobileClose: () => void; onLibrary: (view: PromptView) => void; onLogin: () => void; onSignOut: () => void };
export default function Sidebar({ pathname, activeView, profileHref, userName, mobileOpen, onMobileClose, onLibrary, onLogin, onSignOut }: SidebarProps) {
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = drawer.current;
    if (!element) return;
    if (mobileOpen && !element.open) element.showModal();
    if (!mobileOpen && element.open) element.close();
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 768px)");
    const resize = () => { if (media.matches) onMobileClose(); };
    media.addEventListener("change", resize);
    return () => { document.body.style.overflow = previous; media.removeEventListener("change", resize); };
  }, [mobileOpen, onMobileClose]);
  function navigation(mobile: boolean) {
    const itemClass = "site-icon-button size-11";
    const current = (active: boolean) => active ? " bg-foreground/[0.07] text-foreground" : "";
    return <>
      {mobile && <button type="button" onClick={onMobileClose} aria-label="Fechar navegação" className={`${itemClass} mb-2`}><X size={20} /></button>}
      <Link href="/" onClick={onMobileClose} aria-label="Mind — início" className="mb-7 grid size-12 place-items-center text-foreground [&>svg]:size-[72px]"><Logo /></Link>
      <nav aria-label="Navegação principal" className="flex flex-col gap-2">
        <Link href="/" onClick={onMobileClose} title="Explorar" aria-label="Explorar" aria-current={pathname === "/" ? "page" : undefined} className={itemClass + current(pathname === "/")}><Compass size={20} /></Link>
        <button type="button" onClick={() => onLibrary("all")} title="Biblioteca" aria-label="Biblioteca" aria-current={pathname === "/home" && activeView === "all" ? "page" : undefined} className={itemClass + current(pathname === "/home" && activeView === "all")}><Library size={20} /></button>
        <button type="button" onClick={() => onLibrary("favorites")} title="Favoritos" aria-label="Favoritos" aria-current={pathname === "/home" && activeView === "favorites" ? "page" : undefined} className={itemClass + current(pathname === "/home" && activeView === "favorites")}><Star size={20} /></button>
        {profileHref ? <Link href={profileHref} onClick={onMobileClose} title="Meu perfil" aria-label="Meu perfil" aria-current={pathname === profileHref ? "page" : undefined} className={itemClass + current(pathname === profileHref)}><UserRound size={20} /></Link> : <button type="button" onClick={() => { onMobileClose(); onLogin(); }} title="Entrar" aria-label="Entrar" className={itemClass}><LogIn size={20} /></button>}
      </nav>
      {profileHref && <div className="mt-auto flex flex-col items-center gap-3">
        <Link href={profileHref} onClick={onMobileClose} title={userName} aria-label={`Perfil de ${userName}`} className="grid size-10 place-items-center rounded-full bg-foreground/[0.07] text-sm font-medium">{Array.from(userName)[0]?.toUpperCase() || "M"}</Link>
        <button type="button" title="Sair da conta" aria-label="Sair da conta" onClick={onSignOut} className={itemClass}><LogOut size={20} /></button>
      </div>}
    </>;
  }
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center border-r border-border bg-surface py-3 md:flex">{navigation(false)}</aside>
    <dialog id="mobile-navigation" ref={drawer} className="site-navigation-drawer" aria-label="Navegação do Mind" onCancel={event => { event.preventDefault(); onMobileClose(); }} onClose={onMobileClose}
      onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX > rect.right) onMobileClose(); } }}>
      <div className="flex min-h-full flex-col items-center py-3">{navigation(true)}</div>
    </dialog>
  </>;
}
