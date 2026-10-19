export const locales = ["en", "es", "ja", "pt", "fr"] as const;
export type Locale = (typeof locales)[number];
export type Theme = "light" | "dark" | "system";
export const languages: { code: Locale; name: string; flag: string; intl: string }[] = [
  { code: "en", name: "English", flag: "gb", intl: "en-US" },
  { code: "es", name: "Español", flag: "es", intl: "es-ES" },
  { code: "ja", name: "日本語", flag: "jp", intl: "ja-JP" },
  { code: "pt", name: "Português", flag: "br", intl: "pt-BR" },
  { code: "fr", name: "Français", flag: "fr", intl: "fr-FR" },
];
export function isLocale(value: unknown): value is Locale { return locales.includes(value as Locale); }
export function isTheme(value: unknown): value is Theme { return value === "light" || value === "dark" || value === "system"; }
