import { cookies } from "next/headers";
import { isLocale, languages } from "./config";
import { translate, type MessageValues } from "./translate";
export async function getServerI18n() {
  const value = (await cookies()).get("mind-locale")?.value;
  const locale = isLocale(value) ? value : "en";
  return { locale, intlLocale: languages.find(language => language.code === locale)!.intl,
    t: (source: string, values?: MessageValues) => translate(source, locale, values) };
}
