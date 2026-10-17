import ResourceCatalog from "@/components/resources/ResourceCatalog";
import { getPublicResources } from "@/lib/supabase/resource-server";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Diretório de MCPs · Mind",
  description:
    "Descubra servidores MCP, documentação oficial e configurações para suas ferramentas de IA.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams,
    query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const result = await getPublicResources("mcp", query)
    .then((resources) => ({ resources, failed: false }))
    .catch(() => ({ resources: [], failed: true }));
  return <ResourceCatalog kind="mcp" query={query} {...result} />;
}
