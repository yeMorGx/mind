"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { languages, type Locale, type Theme } from "@/lib/i18n/config";
import { translate, type MessageValues } from "@/lib/i18n/translate";

type Preferences = {
  locale: Locale; intlLocale: string; theme: Theme;
  setLocale: (locale: Locale) => void; setTheme: (theme: Theme) => void;
  t: (source: string, values?: MessageValues) => string;
};
const PreferencesContext = createContext<Preferences | null>(null);
function persist(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
export default function PreferencesProvider({ children, initialLocale, initialTheme }: {
  children: ReactNode; initialLocale: Locale; initialTheme: Theme;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [savedLocale, updateLocale] = useState(initialLocale);
  const [theme, updateTheme] = useState(initialTheme);
  // The landing's approved presentation and copy stay independent.
  const landing = pathname === "/";
  const locale = landing ? "pt" : savedLocale;
  const t = useCallback((source: string, values?: MessageValues) => translate(source, locale, values), [locale]);
  const setLocale = useCallback((next: Locale) => { persist("mind-locale", next); updateLocale(next); router.refresh(); }, [router]);
  const setTheme = useCallback((next: Theme) => { persist("mind-theme", next); updateTheme(next); }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = landing ? "light" : theme === "system" ? media.matches ? "dark" : "light" : theme;
      document.documentElement.lang = languages.find(language => language.code === locale)!.intl;
    };
    apply(); media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, locale, landing]);
  const value = useMemo(() => ({ locale, intlLocale: languages.find(language => language.code === locale)!.intl,
    theme, setTheme, setLocale, t }), [locale, theme, setTheme, setLocale, t]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export function useI18n() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("PreferencesProvider is required.");
  return value;
}
