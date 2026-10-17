import {getCampaignSlots} from "@/lib/campaigns/server";
import ResourceCatalog from "@/components/resources/ResourceCatalog";
import { getPublicResources } from "@/lib/supabase/resource-server";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Arquivos Markdown · Mind",
  description:
    "Descubra DESIGN.md, SKILL.md e CLAUDE.md compartilhados pela comunidade.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams,
    query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const sponsored = !query ? getCampaignSlots("markdown") : Promise.resolve({hero:null,card:null});
  const result = await getPublicResources("markdown", query)
    .then((resources) => ({ resources, failed: false }))
    .catch(() => ({ resources: [], failed: true }));
  const campaign = (await sponsored).card;
  return <ResourceCatalog campaign={campaign} kind="markdown" query={query} {...result} />;
}
