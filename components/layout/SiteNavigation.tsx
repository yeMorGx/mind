"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useId, useState } from "react";
import Link from "next/link";
import { NavigationMenu } from "radix-ui";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  Compass,
  ImageIcon,
  Library,
  ScanFace,
  Star,
  Layers,
  Plus,
  FileCode2,
  Plug,
} from "lucide-react";

export default function SiteNavigation({
  explore,
  library,
  favorites,
  onExplore,
  onLibrary,
  onCreate,
}: {
  explore: boolean;
  library: boolean;
  favorites: boolean;
  onExplore: () => void;
  onLibrary: (favorites: boolean) => void;
  onCreate: () => void;
}) {
 const { t } = useI18n();

  const group = useId();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState("");
  const close = () => setOpen("");
  const mobileItems = [
    { id: "explore", label: t("Explorar"), icon: Compass, active: explore },
    {
      id: "library",
      label: t("Biblioteca"),
      icon: Library,
      active: library && !favorites,
    },
    {
      id: "favorites",
      label: t("Favoritos"),
      icon: Star,
      active: library && favorites,
    },
  ];
  return (
    <>
      <NavigationMenu.Root
        className="showcase-nav desktop-site-navigation"
        aria-label={t("Navegação principal")}
        value={open}
        onValueChange={setOpen}
        delayDuration={120}
      >
        <NavigationMenu.List className="site-nav-list">
          <NavigationMenu.Item value="explore">
            <NavigationMenu.Trigger
              className="site-nav-trigger"
              data-active={explore || undefined}
            >
              {t("Explorar")}{" "}<ChevronDown size={14} />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="site-nav-dropdown">
              <div className="site-nav-discover">
                <NavigationMenu.Link asChild>
                  <Link
                    href="/explore"
                    className="site-nav-feature"
                    onClick={() => {
                      close();
                      onExplore();
                    }}
                  >
                    <Compass size={27} strokeWidth={1.5} />
                    <strong>
                      {t("Uma ideia leva")}<br />{t("a outra.")}</strong>
                    <span>
                      {t("Explore os prompts da comunidade")}{" "}
                      <ArrowUpRight size={17} />
                    </span>
                  </Link>
                </NavigationMenu.Link>
                <div className="site-nav-options">
                  <NavigationMenu.Link asChild>
                    <Link
                      href="/explore"
                      onClick={() => {
                        close();
                        onExplore();
                      }}
                    >
                      <Layers size={19} />
                      <span>
                        <strong>{t("Todos os prompts")}</strong>
                        <small>{t("Encontre sua próxima inspiração")}</small>
                      </span>
                    </Link>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link asChild>
                    <Link href="/explore/markdown" onClick={close}>
                      <FileCode2 size={19} />
                      <span>
                        <strong>{t("Arquivos Markdown")}</strong>
                        <small>{t("DESIGN.md, SKILL.md e CLAUDE.md")}</small>
                      </span>
                    </Link>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link asChild>
                    <Link href="/explore/mcps" onClick={close}>
                      <Plug size={19} />
                      <span>
                        <strong>{t("Diretório de MCPs")}</strong>
                        <small>{t("Conexões para suas ferramentas de IA")}</small>
                      </span>
                    </Link>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link asChild>
                    <Link href="/explore?category=Imagem" onClick={close}>
                      <ImageIcon size={19} />
                      <span>
                        <strong>{t("Imagem")}</strong>
                        <small>{t("Ideias que viram resultados visuais")}</small>
                      </span>
                    </Link>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link asChild>
                    <Link href="/explore?category=Retrato" onClick={close}>
                      <ScanFace size={19} />
                      <span>
                        <strong>{t("Retrato")}</strong>
                        <small>{t("Explore estilos e personagens")}</small>
                      </span>
                    </Link>
                  </NavigationMenu.Link>
                </div>
              </div>
              <div className="site-nav-dropdown-foot">
                {t("Uma comunidade para compartilhar o processo, além do resultado.")}</div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="library">
            <NavigationMenu.Trigger
              className="site-nav-trigger"
              data-active={library || undefined}
            >
              {t("Biblioteca")}{" "}<ChevronDown size={14} />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="site-nav-dropdown site-nav-library">
              <div className="site-nav-options">
                <NavigationMenu.Link asChild>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onLibrary(false);
                    }}
                  >
                    <Library size={20} />
                    <span>
                      <strong>{t("Meus prompts")}</strong>
                      <small>{t("Continue de onde você parou")}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                </NavigationMenu.Link>
                <NavigationMenu.Link asChild>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onLibrary(true);
                    }}
                  >
                    <Star size={20} />
                    <span>
                      <strong>{t("Favoritos")}</strong>
                      <small>{t("As ideias que você quer guardar")}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                </NavigationMenu.Link>
                <NavigationMenu.Link asChild>
                  <Link href="/home/resources" onClick={close}>
                    <FileCode2 size={20} />
                    <span>
                      <strong>{t("Arquivos e MCPs")}</strong>
                      <small>{t("Rascunhos, publicações e recursos salvos")}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                </NavigationMenu.Link>
                <NavigationMenu.Link asChild>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onCreate();
                    }}
                  >
                    <Plus size={20} />
                    <span>
                      <strong>{t("Novo prompt")}</strong>
                      <small>{t("Guarde uma ideia ou compartilhe com todos")}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>
      <LayoutGroup id={group}>
        <nav
          aria-label={t("Navegação no celular")}
          className="showcase-nav mobile-site-navigation"
        >
          {mobileItems.map(({ id, label, icon: Icon, active }) => {
            const content = (
              <>
                {active && (
                  <motion.span
                    className="site-nav-indicator"
                    layoutId="active-page"
                    aria-hidden="true"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 450, damping: 36 }
                    }
                  />
                )}
                <span className="site-nav-label">
                  <Icon size={20} aria-hidden="true" />
                  <span>{t(label)}</span>
                </span>
              </>
            );
            return id === "explore" ? (
              <Link
                key={id}
                href="/explore"
                onClick={onExplore}
                className="site-nav-item"
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                onClick={() => onLibrary(id === "favorites")}
                className="site-nav-item"
                aria-current={active ? "page" : undefined}
              >
                {content}
              </button>
            );
          })}
        </nav>
      </LayoutGroup>
    </>
  );
}
