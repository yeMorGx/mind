import en from "./messages/en.json";
import es from "./messages/es.json";
import ja from "./messages/ja.json";
import fr from "./messages/fr.json";
import type { Locale } from "./config";
export type MessageValues = Record<string, unknown>;
const messages: Record<string, Record<string, string>> = { en, es, ja, fr };
export function translate(source: string, locale: Locale, values?: MessageValues) {
  const text = locale === "pt" ? source : messages[locale]?.[source] ?? messages.en[source] ?? source;
  return values ? text.replace(/\{(\w+)\}/g, (match, key) => key in values ? String(values[key]) : match) : text;
}
