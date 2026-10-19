"use client";
/* eslint-disable @next/next/no-img-element -- Creator images include optimized data URLs and external account avatars. */
import { useI18n } from "@/components/preferences/PreferencesProvider";
import CreatorBadges from "@/components/ui/CreatorBadges";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, Sparkles, X } from "lucide-react";
import { getSearchSuggestions, type SearchSuggestions } from "@/lib/search";
import { creatorProfileHref } from "@/lib/usernames";
type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query?: string) => void;
};
function PersonAvatar({ name, src }: { name: string; src: string }) {
 const { t } = useI18n();

  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return (
      <img
        src={src}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover"
        onError={() => setFailed(src)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-media text-sm font-medium text-foreground"
    >
      {Array.from(name.trim())[0]?.toUpperCase() || t("M")}
    </span>
  );
}
export default function HeaderSearch({ value, onChange, onSearch }: Props) {
 const { t } = useI18n();

  const router = useRouter();
  const root = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    term: string;
    data: SearchSuggestions;
  } | null>(null);
  const term = value.trim().slice(0, 80);
  useEffect(() => {
    if (term.length < 2 || !open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const signal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(8000),
      ]);
      void getSearchSuggestions(term, signal)
        .then((data) => {
          if (!controller.signal.aborted) setResult({ term, data });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setResult({
              term,
              data: { prompts: [], people: [], resources: [], failed: true },
            });
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, open, attempt]);
  useEffect(() => {
    function close(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", shortcut);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", shortcut);
    };
  }, []);
  const current = result?.term === term ? result.data : null;
  const suggestions = current
    ? [
        ...current.prompts.map((prompt) => ({
          key: `prompt:${prompt.creator_id}:${prompt.prompt_id}`,
          href: `/p/${prompt.creator_id}~${prompt.prompt_id}`,
          title: prompt.title,
          detail: ["Prompt", prompt.model].filter(Boolean).join(" · "),
          person: false,
          avatarUrl: "",
          badges: [],
        })),
        ...current.resources.map((resource) => ({
          key: `resource:${resource.id}`,
          href: `/resources/${resource.id}`,
          title: resource.document.title,
          detail: resource.kind === "markdown" ? "Arquivo Markdown" : "MCP",
          person: false,
          avatarUrl: "",
          badges: [],
        })),
        ...current.people.map((person) => ({
          key: `person:${person.public_id}`,
          href: creatorProfileHref(person.public_id, person.username),
          title: person.name,
          detail: `@${person.username} · Ver perfil`,
          person: true,
          avatarUrl: person.avatar_url || "",
          badges: person.badges,
        })),
      ]
    : [];
  const selected = active >= 0 && active < suggestions.length ? active : -1;
  function submit() {
    setOpen(false);
    setActive(-1);
    onSearch(term);
  }
  return (
    <form
      ref={root}
      role="search"
      className="showcase-search relative"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="relative block">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
        />
        <span className="sr-only">
          {t("Buscar prompts, arquivos, MCPs e criadores")}</span>
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && selected >= 0 ? `${listId}-${selected}` : undefined
          }
          autoComplete="off"
          maxLength={80}
          value={value}
          placeholder={t("Buscar ideias, arquivos, MCPs ou @criadores…")}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              setActive(-1);
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              if (suggestions.length) {
                const next =
                  event.key === "ArrowDown"
                    ? (selected + 1) % suggestions.length
                    : selected <= 0
                      ? suggestions.length - 1
                      : selected - 1;
                setActive(next);
                document
                  .getElementById(`${listId}-${next}`)
                  ?.scrollIntoView({ block: "nearest" });
              }
            }
            if (event.key === "Enter" && open && selected >= 0) {
              event.preventDefault();
              setOpen(false);
              setActive(-1);
              router.push(suggestions[selected].href);
            }
          }}
          className="h-11 w-full rounded-full border border-transparent bg-background pl-11 pr-11 text-sm outline-none placeholder:text-subtle focus:border-foreground"
        />
      </label>
      {value && (
        <button
          type="button"
          aria-label={t("Limpar busca")}
          onClick={() => {
            onChange("");
            setActive(-1);
            input.current?.focus();
          }}
          className="absolute right-1 top-1 grid size-9 place-items-center rounded-full text-muted hover:bg-media"
        >
          <X size={15} />
        </button>
      )}
      {open && (
        <div className="header-search-panel">
          <div
            id={listId}
            role="listbox"
            aria-label={t("Sugestões de busca")}
            className="header-search-options"
          >
            {term.length < 2 ? (
              <p
                role="status"
                className="px-4 py-5 text-sm leading-6 text-muted"
              >
                {t("Busque por prompts, arquivos Markdown, MCPs ou @ do criador. Digite pelo menos 2 caracteres.")}</p>
            ) : !current ? (
              <p role="status" className="px-4 py-5 text-sm text-muted">
                {t("Buscando sugestões…")}</p>
            ) : (
              <>
                {suggestions.map((item, index) => (
                  <Link
                    key={item.key}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={selected === index}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      setActive(-1);
                    }}
                    onPointerMove={() => setActive(index)}
                    className={`header-search-option ${selected === index ? "is-selected" : ""}`}
                  >
                    {item.person ? (
                      <PersonAvatar name={item.title} src={item.avatarUrl} />
                    ) : (
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-xl bg-media text-muted"
                        aria-hidden="true"
                      >
                        <Sparkles size={17} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{item.title}</span>
                        {item.person && (
                          <CreatorBadges badges={item.badges} compact />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {item.detail}
                      </span>
                    </span>
                    <ArrowUpRight size={15} className="shrink-0 text-subtle" />
                  </Link>
                ))}
                {!suggestions.length && !current.failed && (
                  <p
                    role="status"
                    className="px-4 py-5 text-sm leading-6 text-muted"
                  >
                    {t("Nenhum resultado para “")}{term}{t("”. Tente outro tema ou @.")}</p>
                )}
                {current.failed && (
                  <div role="status" className="px-4 py-4 text-sm text-muted">
                    <p>{t("Não foi possível carregar todas as sugestões.")}</p>
                    <button
                      type="button"
                      onClick={() => setAttempt((value) => value + 1)}
                      className="mt-2 underline underline-offset-4"
                    >
                      {t("Tentar novamente")}</button>
                  </div>
                )}
              </>
            )}
          </div>
          {term.length >= 2 && (
            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-border px-4 py-3 text-left text-sm font-medium hover:bg-surface-hover"
            >
              <span className="truncate">{t("Ver resultados para “")}{term}”</span>
              <Search size={16} className="shrink-0" />
            </button>
          )}
          <span className="sr-only" role="status" aria-live="polite">
            {open && current && suggestions.length
              ? t("{v0} sugestões. Use as setas para navegar e Enter para abrir.", {v0: (suggestions.length)})
              : ""}
          </span>
        </div>
      )}
    </form>
  );
}
