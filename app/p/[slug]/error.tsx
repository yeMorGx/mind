"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import Link from "next/link";

export default function PromptError({ reset }: { reset: () => void }) {
 const { t } = useI18n();

  return (
    <main className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">{t("Não conseguimos carregar este prompt")}</h1>
        <p className="mt-4 text-sm leading-6 text-muted">{t("Ocorreu um problema ao buscar a publicação. Tente novamente em alguns instantes.")}</p>
        <button type="button" onClick={reset} className="mt-7 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t("Tentar novamente")}</button>
        <Link href="/" className="mt-5 block text-sm text-muted hover:text-foreground">{t("Voltar para os prompts")}</Link>
      </div>
    </main>
  );
}
