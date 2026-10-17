import Link from "next/link";
export default function ResourceTabs({
  active,
}: {
  active: "prompts" | "markdown" | "mcp";
}) {
  return (
    <nav className="resource-tabs" aria-label="Tipos de publicação">
      <Link
        href="/explore"
        aria-current={active === "prompts" ? "page" : undefined}
      >
        Prompts
      </Link>
      <Link
        href="/explore/markdown"
        aria-current={active === "markdown" ? "page" : undefined}
      >
        Arquivos Markdown
      </Link>
      <Link
        href="/explore/mcps"
        aria-current={active === "mcp" ? "page" : undefined}
      >
        MCPs
      </Link>
    </nav>
  );
}
