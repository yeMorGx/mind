"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
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
 const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="site-footer-panel">
        <div className="site-footer-invitation">
          <h2>
            {t("Bons prompts")}<br />
            <span>{t("merecem circular.")}</span>
          </h2>
          <button
            type="button"
            className="site-footer-create"
            onClick={onCreate}
          >
            <span>
              {t("Compartilhar")}<br />
              {t("um prompt")}</span>
            <span className="site-footer-create-arrow">
              <ArrowUpRight size={32} strokeWidth={1.5} aria-hidden="true" />
            </span>
          </button>
        </div>
        <div className="site-footer-main site-footer-main-contact">
          <p>
            {t("Um lugar para compartilhar os prompts por trás dos seus resultados.")}</p>
          <nav aria-label={t("Explorar no rodapé")}>
            <h2>{t("Descobrir")}</h2>
            <Link href="/explore">{t("Explorar prompts")}</Link>
            <Link href="/explore/markdown">{t("Arquivos Markdown")}</Link>
            <Link href="/explore/mcps">{t("Diretório de MCPs")}</Link>
            <button type="button" onClick={() => onLibrary(false)}>
              {t("Minha biblioteca")}</button>
            <button type="button" onClick={() => onLibrary(true)}>
              {t("Meus favoritos")}</button>
          </nav>
          <nav aria-label={t("Conta no rodapé")}>
            <h2>{t("Sua conta")}</h2>
            <Link href="/plans">{t("Planos")}</Link>
            <Link href="/home/billing">{t("Minha assinatura")}</Link>
            {profileHref ? (
              <>
                <Link href={profileHref}>{t("Meu perfil")}</Link>
                <Link href="/home/settings">{t("Configurações")}</Link>
              </>
            ) : (
              <button type="button" onClick={onLogin}>
                {t("Entrar no Mind")}</button>
            )}
            <button type="button" onClick={onCreate}>
              {t("Criar um prompt")}</button>
          </nav>
          <nav aria-label={t("Contato no rodapé")}>
            <h2>{t("Conecte-se")}</h2>
            <Link href="/work-with-us">{t("Trabalhe conosco")}</Link>
            <Link href="/business">{t("Para empresas")}</Link>
          </nav>
        </div>
        <Link
          href="/explore"
          className="site-footer-wordmark"
          aria-label={t("Mind — explorar prompts")}
        >
          <span aria-hidden="true">Mind</span>
          <span className="site-footer-symbol" aria-hidden="true">
            <Logo />
          </span>
        </Link>
        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} Mind</p>
          <p>{t("Feito para criar. Aberto para compartilhar.")}</p>
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
            {t("Voltar ao topo")}{" "}<ArrowUp size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
