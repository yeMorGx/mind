"use client";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type {BadgeKind} from "@/lib/firebase/badges";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Settings, LogOut, UserRound, Compass, Library, Star } from "lucide-react";
import HeaderSearch from "@/components/search/HeaderSearch";
import Logo from "@/components/ui/logo";
type HeaderProps = {
  searchValue: string; onSearchChange: (value: string) => void; onSearch: (query?: string) => void;
  badges?:BadgeKind[]; profileHref?: string; userName: string; photoUrl?: string; googlePhotoUrl?: string; onLogin: () => void; authReady: boolean; onCreate: () => void;
  library: boolean; favorites: boolean; onLibrary: (favorites: boolean) => void; onExplore: () => void; onSignOut: () => void;
};
function AccountAvatar({src,fallback,initials}: {src?:string;fallback?:string;initials:string}) {
  const [failed,setFailed]=useState<string[]>([]);
  const current=[src,fallback].find(value=>value&&!failed.includes(value));
  // eslint-disable-next-line @next/next/no-img-element -- Account avatars include Google URLs and optimized data URLs.
  return current?<img src={current} alt="" referrerPolicy="no-referrer" className="size-10 rounded-full object-cover" onError={()=>setFailed(values=>[...values,current])}/>:<span>{initials||"M"}</span>;
}
export default function Header({ searchValue, onSearchChange, onSearch, profileHref, badges, userName, photoUrl, googlePhotoUrl, onLogin, authReady, onCreate, library, favorites, onLibrary, onExplore, onSignOut }: HeaderProps) {
  const pathname = usePathname();
  const account = useRef<HTMLDetailsElement>(null);
  useEffect(() => { account.current?.removeAttribute("open"); },[pathname]);
  useEffect(() => {
    function close(event: PointerEvent) { if (event.target instanceof Node && !account.current?.contains(event.target)) account.current?.removeAttribute("open"); }
    document.addEventListener("pointerdown",close);
    return () => document.removeEventListener("pointerdown",close);
  },[]);
  const initials = userName.trim().split(/\s+/).slice(0,2).map(part => Array.from(part)[0]).join("").toUpperCase();
  return <header className="site-header showcase-header fixed inset-x-0 top-0 z-40 bg-surface">
    <div className="showcase-header-inner">
      <Link href={profileHref ? "/home" : "/explore"} aria-label="Mind — início" className="showcase-brand"><span className="catalog-logo"><Logo /></span></Link>
      <nav aria-label="Navegação principal" className="showcase-nav">
        <Link href="/explore" onClick={onExplore} aria-current={pathname === "/explore" ? "page" : undefined}><Compass size={20} className="md:hidden" />Explorar</Link>
        <button type="button" onClick={() => onLibrary(false)} aria-current={library && !favorites ? "page" : undefined}><Library size={20} className="md:hidden" />Biblioteca</button>
        <button type="button" onClick={() => onLibrary(true)} aria-current={library && favorites ? "page" : undefined}><Star size={20} className="md:hidden" />Favoritos</button>
      </nav>
      <HeaderSearch value={searchValue} onChange={onSearchChange} onSearch={onSearch} />
      <div className="showcase-account-actions">
        <button type="button" onClick={onCreate} disabled={!authReady} aria-label="Novo prompt" className={`${profileHref ? "flex" : "hidden sm:flex"} h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 lg:px-5`}><Plus size={17} /><span className="hidden lg:inline">Novo prompt</span></button>
        {profileHref ? <details ref={account} className="relative" onKeyDown={event => { if (event.key === "Escape") { account.current?.removeAttribute("open"); account.current?.querySelector("summary")?.focus(); } }}>
          <summary aria-label="Menu da conta" className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-media text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden"><AccountAvatar key={profileHref} src={photoUrl} fallback={googlePhotoUrl} initials={initials}/></summary>
          <div className="absolute right-0 top-13 w-56 rounded-2xl border border-border bg-surface p-2"><div className="flex items-center gap-2 px-3 py-2 text-xs text-muted"><span className="truncate">{userName}</span><CreatorBadges badges={badges} compact/></div><Link href={profileHref} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm hover:bg-surface-hover"><UserRound size={16} />Meu perfil</Link><Link href="/home/settings" className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm hover:bg-surface-hover"><Settings size={16} />Configurações</Link><button type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-surface-hover"><LogOut size={16} />Sair da conta</button></div>
        </details> : <button type="button" disabled={!authReady} onClick={onLogin} className="h-10 shrink-0 rounded-full border border-border px-4 text-sm font-medium hover:bg-surface-hover disabled:opacity-50">Entrar</button>}
      </div>
    </div>
  </header>;
}
