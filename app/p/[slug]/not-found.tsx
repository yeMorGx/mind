import { getServerI18n } from "@/lib/i18n/server";
import Link from "next/link";

export default async function PromptNotFound() {
 const { t } = await getServerI18n();

  return (
    <main className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-sm text-subtle">{t("Mind · Prompts da comunidade")}</p>
        <h1 className="mt-4 text-3xl font-semibold">{t("Este prompt não está disponível")}</h1>
        <p className="mt-4 text-sm leading-6 text-muted">{t("O link pode estar incorreto ou o prompt pode ter sido removido ou voltado a ser um rascunho.")}</p>
        <Link href="/" className="mt-7 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t("Explorar outros prompts")}</Link>
      </div>
    </main>
  );
}
