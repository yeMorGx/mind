"use client";
/* eslint-disable @next/next/no-img-element -- Creator images include optimized data URLs and external account avatars. */
import { useI18n } from "@/components/preferences/PreferencesProvider";
import PreferencesMenu from "@/components/preferences/AppearanceControls";
import UsageBadge from "@/components/billing/UsageBadge";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type { BadgeKind } from "@/lib/firebase/badges";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Settings, LogOut, UserRound, FileCode2, Megaphone } from "lucide-react";
import HeaderSearch from "@/components/search/HeaderSearch";
import Logo from "@/components/ui/logo";
import SiteNavigation from "./SiteNavigation";
import "./site-chrome.css";
type HeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: (query?: string) => void;
  badges?: BadgeKind[];
  profileHref?: string;
  userName: string;
  photoUrl?: string;
  googlePhotoUrl?: string;
  onLogin: () => void;
  authReady: boolean;
  onCreate: () => void;
  library: boolean;
  favorites: boolean;
  onLibrary: (favorites: boolean) => void;
  onExplore: () => void;
  onSignOut: () => void;
};
function AccountAvatar({
  src,
  fallback,
  initials,
}: {
  src?: string;
  fallback?: string;
  initials: string;
}) {
 const { t } = useI18n();

  const [failed, setFailed] = useState<string[]>([]);
  const current = [src, fallback].find(
    (value) => value && !failed.includes(value),
  );
  return current ? (
    <img
      src={current}
      alt=""
      referrerPolicy="no-referrer"
      className="size-10 rounded-full object-cover"
      onError={() => setFailed((values) => [...values, current])}
    />
  ) : (
    <span>{initials || t("M")}</span>
  );
}
export default function Header({
  searchValue,
  onSearchChange,
  onSearch,
  profileHref,
  badges,
  userName,
  photoUrl,
  googlePhotoUrl,
  onLogin,
  authReady,
  onCreate,
  library,
  favorites,
  onLibrary,
  onExplore,
  onSignOut,
}: HeaderProps) {
 const { t } = useI18n();

  const pathname = usePathname();
  const account = useRef<HTMLDetailsElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const update = () =>
      setCompact((previous) => window.scrollY > (previous ? 40 : 100));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    account.current?.removeAttribute("open");
  }, [pathname]);
  useEffect(() => {
    function close(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !account.current?.contains(event.target)
      )
        account.current?.removeAttribute("open");
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();
  return (
    <header
      className="site-header showcase-header floating-site-header fixed inset-x-0 top-0 z-40 bg-surface"
      data-compact={compact || undefined}
    >
      <div className="showcase-header-inner">
        <Link
          href="/explore"
          aria-label={t("Mind — início")}
          className="showcase-brand"
        >
          <span className="catalog-logo">
            <Logo />
          </span>
        </Link>
        <SiteNavigation
          explore={pathname.startsWith("/explore")}
          library={library}
          favorites={favorites}
          onExplore={onExplore}
          onLibrary={onLibrary}
          onCreate={onCreate}
        />
        <HeaderSearch
          value={searchValue}
          onChange={onSearchChange}
          onSearch={onSearch}
        />
        <div className="showcase-account-actions">
          <PreferencesMenu/>
          <UsageBadge/>
          <button
            type="button"
            onClick={onCreate}
            disabled={!authReady}
            aria-label={t("Novo prompt")}
            className={`${profileHref ? "flex" : "hidden sm:flex"} h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 lg:px-5`}
          >
            <Plus size={17} />
            <span className="hidden lg:inline">{t("Novo prompt")}</span>
          </button>
          {profileHref ? (
            <details
              ref={account}
              className="relative"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  account.current?.removeAttribute("open");
                  account.current?.querySelector("summary")?.focus();
                }
              }}
            >
              <summary
                aria-label={t("Menu da conta")}
                className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-media text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden"
              >
                <AccountAvatar
                  key={profileHref}
                  src={photoUrl}
                  fallback={googlePhotoUrl}
                  initials={initials}
                />
              </summary>
              <div className="absolute right-0 top-13 w-56 rounded-2xl border border-border bg-surface p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                  <span className="truncate">{userName}</span>
                  <CreatorBadges badges={badges} compact />
                </div>
                <Link
                  href={profileHref}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm hover:bg-surface-hover"
                >
                  <UserRound size={16} />
                  {t("Meu perfil")}</Link>
                <Link
                  href="/home/resources"
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm hover:bg-surface-hover"
                >
                  <FileCode2 size={16} />
                  {t("Arquivos e MCPs")}</Link>
                {badges?.includes("owner") && <Link href="/home/campaigns" className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm hover:bg-surface-hover"><Megaphone size={16}/>{t("Campanhas")}</Link>}
                <Link
                  href="/home/settings"
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm hover:bg-surface-hover"
                >
                  <Settings size={16} />
                  {t("Configurações")}</Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-surface-hover"
                >
                  <LogOut size={16} />
                  {t("Sair da conta")}</button>
              </div>
            </details>
          ) : (
            <button
              type="button"
              disabled={!authReady}
              onClick={onLogin}
              className="h-10 shrink-0 rounded-full border border-border px-4 text-sm font-medium hover:bg-surface-hover disabled:opacity-50"
            >
              {t("Entrar")}</button>
          )}
        </div>
      </div>
    </header>
  );
}
