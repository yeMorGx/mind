"use client";
import Link from "next/link";
import { Menu, Search, UserRound } from "lucide-react";

type HeaderProps = { title: string; searchValue?: string; onSearchChange: (value: string) => void; onMenuClick: () => void; mobileOpen: boolean; profileHref?: string; onLogin: () => void; authReady: boolean };
export default function Header({ title, searchValue, onSearchChange, onMenuClick, mobileOpen, profileHref, onLogin, authReady }: HeaderProps) {
  return <header className="site-header fixed inset-x-0 top-0 z-30 h-16 border-b border-border bg-surface md:left-20">
    <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
      <div className="flex shrink-0 items-center gap-2">
        <div className="md:hidden"><button type="button" onClick={onMenuClick} aria-label="Abrir navegação" aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="site-icon-button"><Menu size={20} /></button></div>
        <p className={`text-sm font-medium ${searchValue !== undefined ? "hidden sm:block" : ""}`}>{title}</p>
      </div>
      {searchValue !== undefined && <label className="relative ml-auto block w-full max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <span className="sr-only">Buscar na biblioteca</span>
        <input type="search" value={searchValue} onChange={event => onSearchChange(event.target.value)} placeholder="Buscar prompts…" className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none placeholder:text-subtle focus:border-foreground" />
      </label>}
      {profileHref ? <Link href={profileHref} title="Meu perfil" aria-label="Meu perfil" className="site-icon-button shrink-0"><UserRound size={20} /></Link> : <button type="button" disabled={!authReady} onClick={onLogin} className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">Entrar</button>}
    </div>
  </header>;
}
