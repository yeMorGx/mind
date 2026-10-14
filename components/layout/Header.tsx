"use client";
import Link from "next/link";
import { Menu, Plus, Search, ChevronDown } from "lucide-react";
import Logo from "@/components/ui/logo";
type HeaderProps = {
  searchValue: string; onSearchChange: (value: string) => void; onSearch: () => void; onMenuClick: () => void; mobileOpen: boolean;
  profileHref?: string; userName: string; onLogin: () => void; authReady: boolean; onCreate: () => void;
  models: string[]; model: string; onModelChange: (value: string) => void;
};
export default function Header({ searchValue, onSearchChange, onSearch, onMenuClick, mobileOpen, profileHref, userName, onLogin, authReady, onCreate, models, model, onModelChange }: HeaderProps) {
  const initials = userName.trim().split(/\s+/).slice(0,2).map(part => Array.from(part)[0]).join("").toUpperCase();
  return <header className="site-header catalog-header fixed inset-x-0 top-0 z-40 flex h-18 items-center border-b border-border bg-surface">
    <Link href={profileHref ? "/home" : "/explore"} aria-label="Mind — início" className="catalog-brand hidden h-full shrink-0 items-center gap-2 text-xl font-semibold tracking-tight md:flex">
      <span className="catalog-logo"><Logo /></span><span className="hidden lg:inline">Mind</span>
    </Link>
    <div className="flex min-w-0 flex-1 items-center gap-2 px-4 md:gap-4 md:px-6 lg:px-8">
      <div className="md:hidden"><button type="button" onClick={onMenuClick} aria-label="Abrir navegação" aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="site-icon-button"><Menu size={20} /></button></div>
      <form role="search" onSubmit={event => { event.preventDefault(); onSearch(); }} className="min-w-0 flex-1">
        <label className="relative block"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" /><span className="sr-only">Buscar prompts, modelos ou criadores</span>
          <input type="search" value={searchValue} onChange={event => onSearchChange(event.target.value)} placeholder="Buscar prompts, modelos, criadores…" className="h-11 w-full rounded-xl border border-transparent bg-background pl-11 pr-3 text-sm outline-none placeholder:text-subtle focus:border-foreground" />
        </label>
      </form>
      {models.length > 0 && <label className="relative hidden shrink-0 xl:block"><span className="sr-only">Filtrar por modelo</span><select value={model} onChange={event => onModelChange(event.target.value)} className="h-11 max-w-44 appearance-none rounded-xl border border-border bg-surface py-2 pl-4 pr-9 text-sm"><option value="">Todos os modelos</option>{models.map(value => <option key={value} value={value}>{value}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></label>}
      <button type="button" onClick={onCreate} disabled={!authReady} aria-label="Novo prompt" className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 lg:px-4"><Plus size={18} /><span className="hidden lg:inline">Novo prompt</span></button>
      {profileHref ? <Link href={profileHref} title="Meu perfil" aria-label="Meu perfil" className="grid size-10 shrink-0 place-items-center rounded-full bg-media text-sm font-semibold text-foreground">{initials || "M"}</Link> : <button type="button" disabled={!authReady} onClick={onLogin} className="h-11 shrink-0 rounded-xl border border-border px-3 text-sm font-medium hover:bg-surface-hover disabled:opacity-50">Entrar</button>}
    </div>
  </header>;
}
