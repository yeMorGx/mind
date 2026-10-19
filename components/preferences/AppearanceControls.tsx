"use client";
/* eslint-disable @next/next/no-img-element -- Local SVG country flags. */
import { Check, Moon, Sun, Monitor, ChevronDown } from "lucide-react";
import { useEffect, useRef, useId } from "react";
import { SelectField } from "@/components/ui/SelectField";
import { languages, isLocale, type Theme } from "@/lib/i18n/config";
import { useI18n } from "./PreferencesProvider";
import "./preferences.css";

export function AppearanceControls() {
  const { t, locale, setLocale, theme, setTheme } = useI18n();
  const themeId = useId();
  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("Claro"), icon: Sun }, { value: "dark", label: t("Escuro"), icon: Moon }, { value: "system", label: t("Sistema"), icon: Monitor },
  ];
  return <div className="appearance-controls">
    <fieldset className="theme-choice"><legend>{t("Tema")}</legend><p>{t("Escolha a aparência que fica mais confortável para você.")}</p>
      <div className="theme-options">{themes.map(({ value, label, icon: Icon }) => <label key={value} data-selected={theme === value || undefined}>
        <input type="radio" name={`mind-theme-${themeId}`} value={value} checked={theme === value} onChange={() => setTheme(value)}/>
        <span className={`theme-preview theme-preview-${value}`} aria-hidden="true"><span/><span><i/><i/><i/></span></span>
        <span className="theme-option-name"><Icon size={16}/>{t(label)}{theme === value && <Check size={15}/>}</span>
      </label>)}</div>
    </fieldset>
    <div className="language-choice"><SelectField label={t("Idioma da interface")} value={locale} onValueChange={value => { if (isLocale(value)) setLocale(value); }}
      options={languages.map(language => ({ value: language.code, label: language.name,
        icon: <img src={`/flags/${language.flag}.svg`} alt="" className="language-flag"/> }))}/>
      <p>{t("O idioma muda os menus e as mensagens do site. O conteúdo dos criadores permanece no idioma original.")}</p>
    </div>
  </div>;
}

export default function PreferencesMenu() {
  const { t, locale } = useI18n();
  const menu = useRef<HTMLDetailsElement>(null);
  const language = languages.find(item => item.code === locale)!;
  useEffect(() => {
    const close = (event: PointerEvent) => { if (event.target instanceof Node && !menu.current?.contains(event.target)) menu.current?.removeAttribute("open"); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return <details className="preferences-menu" ref={menu} onKeyDown={event => { if (event.key === "Escape") { menu.current?.removeAttribute("open"); menu.current?.querySelector("summary")?.focus(); } }}>
    <summary aria-label={t("Tema e idioma")}><img className="language-flag" src={`/flags/${language.flag}.svg`} alt=""/><ChevronDown size={12}/></summary>
    <div className="preferences-popover"><h2>{t("Aparência")}</h2><AppearanceControls/></div>
  </details>;
}
