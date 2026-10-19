"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import Link from "next/link";
export default function ResourceTabs({
  active,
}: {
  active: "prompts" | "markdown" | "mcp";
}) {
 const { t } = useI18n();

  return (
    <nav className="resource-tabs" aria-label={t("Tipos de publicação")}>
      <Link
        href="/explore"
        aria-current={active === "prompts" ? "page" : undefined}
      >
        {t("Prompts")}</Link>
      <Link
        href="/explore/markdown"
        aria-current={active === "markdown" ? "page" : undefined}
      >
        {t("Arquivos Markdown")}</Link>
      <Link
        href="/explore/mcps"
        aria-current={active === "mcp" ? "page" : undefined}
      >
        MCPs
      </Link>
    </nav>
  );
}
