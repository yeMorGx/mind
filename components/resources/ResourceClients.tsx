/* eslint-disable @next/next/no-img-element -- Locally hosted, licensed brand SVGs. */
import { Blocks } from "lucide-react";

const icons: Record<string, string> = {
  Claude: "claude-color",
  "Claude Code": "claudecode-color",
  ChatGPT: "openai",
  Codex: "codex",
  Cursor: "cursor",
  "Gemini CLI": "gemini-color",
  "VS Code": "vscode",
  Windsurf: "windsurf",
};

export function ResourceClientIdentity({ value, iconOnly = false }: { value: string; iconOnly?: boolean }) {
  return <span className="resource-client-identity" title={value}>
    {icons[value] ? <img src={`/ai-models/${icons[value]}.svg`} width={18} height={18} alt={iconOnly ? value : ""} loading="lazy"/> : <Blocks size={18} aria-hidden="true"/>}
    {(!iconOnly || !icons[value]) && <span>{value}</span>}
  </span>;
}

export default function ResourceClients({ clients, compact = false, empty = "Consulte as instruções" }: { clients: string[]; compact?: boolean; empty?: string }) {
  if (!clients.length) return compact ? null : <span>{empty}</span>;
  const visible = compact ? clients.slice(0, 4) : clients;
  return <ul className={`resource-client-list${compact ? " resource-client-list-compact" : ""}`} aria-label="Ferramentas compatíveis">
    {visible.map(value => <li key={value}><ResourceClientIdentity value={value} iconOnly={compact}/></li>)}
    {compact && clients.length > visible.length && <li className="resource-client-more" aria-label={`Também compatível com ${clients.slice(4).join(", ")}`} title={clients.slice(4).join(", ")}>+{clients.length - visible.length}</li>}
  </ul>;
}
