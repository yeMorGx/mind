"use client";

import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import Logo from "@/components/ui/logo";

export default function SiteFooter({ profileHref, onLibrary, onCreate, onLogin }: {
  profileHref?: string; onLibrary: (favorites: boolean) => void; onCreate: () => void; onLogin: () => void;
}) {
  return <footer className="site-footer">
    <div className="site-footer-main">
      <div className="site-footer-intro">
        <Link href="/explore" className="site-footer-brand" aria-label="Mind — explorar prompts"><span><Logo/></span>Mind</Link>
        <p>O próximo resultado começa com uma boa ideia.</p>
        <button type="button" className="site-footer-create" onClick={onCreate}>Compartilhar um prompt <ArrowUpRight size={17} aria-hidden="true"/></button>
      </div>
      <nav aria-label="Explorar no rodapé"><h2>Descobrir</h2><Link href="/explore">Explorar prompts</Link><button type="button" onClick={() => onLibrary(false)}>Minha biblioteca</button><button type="button" onClick={() => onLibrary(true)}>Meus favoritos</button></nav>
      <nav aria-label="Conta no rodapé"><h2>Sua conta</h2>{profileHref ? <><Link href={profileHref}>Meu perfil</Link><Link href="/home/settings">Configurações</Link></> : <button type="button" onClick={onLogin}>Entrar no Mind</button>}<button type="button" onClick={onCreate}>Criar um prompt</button></nav>
    </div>
    <div className="site-footer-bottom"><p>© {new Date().getFullYear()} Mind</p><p>Prompts e ideias feitos para compartilhar.</p><button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); document.getElementById("conteudo")?.focus({ preventScroll: true }); }}>Voltar ao topo <ArrowUp size={15} aria-hidden="true"/></button></div>
  </footer>;
}
