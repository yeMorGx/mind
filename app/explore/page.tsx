import {getCampaignSlots} from "@/lib/campaigns/server";
import { getPublicResources } from "@/lib/supabase/resource-server";
import type { Metadata } from "next";
import ExploreCatalog from "@/components/catalog/ExploreCatalog";
import {
  getPublicPrompts,
  getSearchedPublicPrompts,
  getPublicUsernames,
  getCatalogCreatorAvatars,
  getCatalogCreatorBadges,
} from "@/lib/supabase/server-data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explore prompts · Mind" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "")
    .trim()
    .slice(0, 80);
  const category = (typeof params.category === "string" ? params.category : "")
    .trim()
    .slice(0, 120);
  const campaignRequest = !query && !category ? getCampaignSlots("prompts") : Promise.resolve({hero:null,card:null});
  const result = await (
    query ? getSearchedPublicPrompts(query) : getPublicPrompts(60)
  )
    .then((prompts) => ({ prompts, loadFailed: false }))
    .catch(() => ({ prompts: [], loadFailed: true }));
  const campaign = await campaignRequest;
  const resources =
    query && !query.startsWith("@")
      ? await getPublicResources(undefined, query).catch(() => [])
      : [];
  const ids = result.prompts.map((prompt) => prompt.creatorId);
  const [names, badges, avatars] = await Promise.all([
    getPublicUsernames(ids).catch(() => ({}) as Record<string, string>),
    getCatalogCreatorBadges(ids).catch(
      () => ({}) as Record<string, import("@/lib/firebase/badges").BadgeKind[]>,
    ),
    getCatalogCreatorAvatars(ids).catch(() => ({}) as Record<string, string>),
  ]);
  return (
    <ExploreCatalog
      campaign={campaign.hero}
      sponsoredCard={campaign.card}
      resources={resources}
      {...result}
      searchQuery={query}
      initialCategory={category}
      prompts={result.prompts.map((prompt) => ({
        ...prompt,
        creatorSlug: names[prompt.creatorId] ?? "",
        creatorAvatarUrl: avatars[prompt.creatorId] ?? "",
        creatorBadges: badges[prompt.creatorId] ?? [],
      }))}
    />
  );
}
