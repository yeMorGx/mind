export type ResourceKind = "markdown" | "mcp";
export type ResourceDocument = {
  title: string;
  summary: string;
  category: string;
  coverUrl: string;
  description: string;
  instructions: string;
  license: string;
  credits: string;
  fileName: string;
  content: string;
  clients: string[];
  developer: string;
  website: string;
  repository: string;
  documentation: string;
  transport: "remote" | "stdio";
  remoteUrl: string;
  command: string;
  args: string;
  config: string;
  authentication: string;
  permissions: string;
  pricing: string;
};
export type Resource = {
  id: string;
  creator_id: string;
  kind: ResourceKind;
  status: "draft" | "published";
  document: ResourceDocument;
  created_at: string;
  updated_at: string;
};
export type ResourceIdentity = {
  name: string;
  avatarUrl?: string;
  username?: string;
  badges?: import("@/lib/firebase/badges").BadgeKind[];
};
export type CatalogResource = Resource & { creator: ResourceIdentity };
export const RESOURCE_CLIENTS = [
  "Claude",
  "Claude Code",
  "ChatGPT",
  "Codex",
  "Cursor",
  "Gemini CLI",
  "VS Code",
  "Windsurf",
  "Outro",
];
export const RESOURCE_CATEGORIES = [
  "Design",
  "Desenvolvimento",
  "Produtividade",
  "Pesquisa",
  "Conteúdo",
  "Dados",
  "Automação",
  "Outro",
];
export function resourceLabel(kind: ResourceKind) {
  return kind === "markdown" ? "Arquivo Markdown" : "MCP";
}
export function resourceCatalogHref(kind: ResourceKind) {
  return kind === "markdown" ? "/explore/markdown" : "/explore/mcps";
}
export function emptyResourceDocument(kind: ResourceKind): ResourceDocument {
  return {
    title: "",
    summary: "",
    category: "",
    coverUrl: "",
    description: "",
    instructions: "",
    license: "",
    credits: "",
    fileName: kind === "markdown" ? "CLAUDE.md" : "",
    content: "",
    clients: [],
    developer: "",
    website: "",
    repository: "",
    documentation: "",
    transport: "remote",
    remoteUrl: "",
    command: "",
    args: "",
    config: "",
    authentication: "",
    permissions: "",
    pricing: "",
  };
}
export function validResourceUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      value.length <= 2048
    );
  } catch {
    return false;
  }
}
export function resourceConfiguration(doc: ResourceDocument) {
  if (doc.config.trim()) return doc.config.trim();
  if (doc.transport === "remote")
    return JSON.stringify(
      { mcpServers: { server: { url: doc.remoteUrl } } },
      null,
      2,
    );
  return JSON.stringify(
    {
      mcpServers: {
        server: {
          command: doc.command,
          args: doc.args.trim() ? JSON.parse(doc.args) : [],
        },
      },
    },
    null,
    2,
  );
}
export function validateResource(
  kind: ResourceKind,
  doc: ResourceDocument,
  publishing = false,
) {
  if (!doc.title.trim() || doc.title.length > 120)
    throw new Error("Informe um título de até 120 caracteres.");
  if (
    doc.summary.length > 180 ||
    doc.description.length > 5000 ||
    doc.instructions.length > 5000 ||
    doc.content.length > 100000 ||
    doc.config.length > 10000
  )
    throw new Error(
      "O conteúdo ultrapassa o limite do campo. Reduza o texto antes de salvar.",
    );
  for (const field of [
    "license",
    "credits",
    "developer",
    "authentication",
    "permissions",
    "pricing",
  ] as const)
    if (doc[field].length > 1000)
      throw new Error("Use até 1.000 caracteres nos detalhes adicionais.");
  for (const field of [
    "website",
    "repository",
    "documentation",
    "remoteUrl",
  ] as const)
    if (doc[field] && !validResourceUrl(doc[field]))
      throw new Error(
        "Use links HTTPS completos, sem credenciais no endereço.",
      );
  if (
    doc.coverUrl &&
    !validResourceUrl(doc.coverUrl) &&
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(doc.coverUrl)
  )
    throw new Error("Escolha uma imagem válida para a capa.");
  if (
    doc.coverUrl.length > 80000 ||
    doc.category.length > 80 ||
    doc.clients.length > 9 ||
    doc.clients.some((item) => !RESOURCE_CLIENTS.includes(item))
  )
    throw new Error(
      "Confira a capa, a categoria e as ferramentas compatíveis.",
    );
  if (
    kind === "markdown" &&
    (!/^[\p{L}\p{N}_. -]{1,76}\.md$/iu.test(doc.fileName) ||
      !doc.content.trim())
  )
    throw new Error(
      "Informe um nome terminado em .md e adicione o conteúdo do arquivo.",
    );
  if (kind === "mcp") {
    if (
      !["remote", "stdio"].includes(doc.transport) ||
      doc.command.length > 500 ||
      doc.args.length > 5000
    )
      throw new Error("Confira o tipo de conexão e o comando.");
    if (doc.args.trim()) {
      let args: unknown;
      try {
        args = JSON.parse(doc.args);
      } catch {
        throw new Error(
          'Os argumentos devem ser uma lista JSON, como ["-y", "pacote"].',
        );
      }
      if (!Array.isArray(args) || args.some((item) => typeof item !== "string"))
        throw new Error("Use apenas textos na lista de argumentos.");
    }
    if (doc.config.trim()) {
      let config: unknown;
      try {
        config = JSON.parse(doc.config);
      } catch {
        throw new Error("A configuração precisa ser um JSON válido.");
      }
      if (!config || typeof config !== "object" || Array.isArray(config))
        throw new Error("A configuração deve ser um objeto JSON.");
    }
    if (
      publishing &&
      (!doc.developer.trim() ||
        !doc.website.trim() ||
        !doc.documentation.trim())
    )
      throw new Error(
        "Para publicar um MCP, informe o desenvolvedor, o site oficial e a documentação.",
      );
    if (
      publishing &&
      !doc.config.trim() &&
      (doc.transport === "remote" ? !doc.remoteUrl : !doc.command.trim())
    )
      throw new Error(
        "Informe a URL remota, o comando local ou a configuração JSON do MCP.",
      );
  }
  if (
    publishing &&
    (!doc.summary.trim() ||
      !doc.category ||
      !doc.instructions.trim() ||
      !doc.license.trim())
  )
    throw new Error(
      "Antes de publicar, complete a descrição breve, a categoria, como usar e a licença ou condições de uso.",
    );
  if (new TextEncoder().encode(JSON.stringify(doc)).length > 250000)
    throw new Error(
      "O arquivo e a capa ultrapassam o limite total. Reduza o conteúdo ou a imagem.",
    );
}
export function resourceError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (["42P01", "PGRST205", "PGRST202"].includes(code))
    return "Esta área ainda está sendo ativada. Tente novamente em breve.";
  return error instanceof Error
    ? error.message
    : "Não foi possível salvar. Confira sua conexão e tente novamente.";
}
export function downloadMarkdown(doc: ResourceDocument) {
  const url = URL.createObjectURL(
    new Blob([doc.content], { type: "text/markdown;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = doc.fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
