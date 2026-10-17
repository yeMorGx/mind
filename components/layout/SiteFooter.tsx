"use client";

import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import Logo from "@/components/ui/logo";
import "@/components/billing/billing.css";

export default function SiteFooter({
  profileHref,
  onLibrary,
  onCreate,
  onLogin,
}: {
  profileHref?: string;
  onLibrary: (favorites: boolean) => void;
  onCreate: () => void;
  onLogin: () => void;
}) {
  return (
    <footer className="site-footer">
      <div className="site-footer-panel">
        <div className="site-footer-invitation">
          <h2>
            Bons prompts
            <br />
            <span>merecem circular.</span>
          </h2>
          <button
            type="button"
            className="site-footer-create"
            onClick={onCreate}
          >
            <span>
              Compartilhar
              <br />
              um prompt
            </span>
            <span className="site-footer-create-arrow">
              <ArrowUpRight size={32} strokeWidth={1.5} aria-hidden="true" />
            </span>
          </button>
        </div>
        <div className="site-footer-main site-footer-main-contact">
          <p>
            Um lugar para compartilhar os prompts por trás dos seus resultados.
          </p>
          <nav aria-label="Explorar no rodapé">
            <h2>Descobrir</h2>
            <Link href="/explore">Explorar prompts</Link>
            <Link href="/explore/markdown">Arquivos Markdown</Link>
            <Link href="/explore/mcps">Diretório de MCPs</Link>
            <button type="button" onClick={() => onLibrary(false)}>
              Minha biblioteca
            </button>
            <button type="button" onClick={() => onLibrary(true)}>
              Meus favoritos
            </button>
          </nav>
          <nav aria-label="Conta no rodapé">
            <h2>Sua conta</h2>
            <Link href="/plans">Planos</Link>
            <Link href="/home/billing">Minha assinatura</Link>
            {profileHref ? (
              <>
                <Link href={profileHref}>Meu perfil</Link>
                <Link href="/home/settings">Configurações</Link>
              </>
            ) : (
              <button type="button" onClick={onLogin}>
                Entrar no Mind
              </button>
            )}
            <button type="button" onClick={onCreate}>
              Criar um prompt
            </button>
          </nav>
          <nav aria-label="Contato no rodapé">
            <h2>Conecte-se</h2>
            <Link href="/work-with-us">Trabalhe conosco</Link>
            <Link href="/business">Para empresas</Link>
          </nav>
        </div>
        <Link
          href="/explore"
          className="site-footer-wordmark"
          aria-label="Mind — explorar prompts"
        >
          <span aria-hidden="true">Mind</span>
          <span className="site-footer-symbol" aria-hidden="true">
            <Logo />
          </span>
        </Link>
        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} Mind</p>
          <p>Feito para criar. Aberto para compartilhar.</p>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              });
              document
                .getElementById("conteudo")
                ?.focus({ preventScroll: true });
            }}
          >
            Voltar ao topo <ArrowUp size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
