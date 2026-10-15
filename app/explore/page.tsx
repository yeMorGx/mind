import type { Metadata } from "next";
import ExploreCatalog from "@/components/catalog/ExploreCatalog";
import { getPublicPrompts, getSearchedPublicPrompts, getPublicUsernames, getCatalogCreatorAvatars,getCatalogCreatorBadges } from "@/lib/supabase/server-data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explorar prompts · Mind" };
export default async function Page({searchParams}: {searchParams: Promise<{q?: string | string[]}>}) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0,80);
  const result = await (query ? getSearchedPublicPrompts(query) : getPublicPrompts(60)).then(prompts => ({ prompts, loadFailed: false })).catch(() => ({ prompts: [], loadFailed: true }));
  const ids = result.prompts.map(prompt => prompt.creatorId);
  const [names,badges,avatars] = await Promise.all([
    getPublicUsernames(ids).catch(() => ({} as Record<string,string>)),
    getCatalogCreatorBadges(ids).catch(()=>({} as Record<string,import("@/lib/firebase/badges").BadgeKind[]>)),
    getCatalogCreatorAvatars(ids).catch(() => ({} as Record<string,string>)),
  ]);
  return <ExploreCatalog {...result} searchQuery={query} prompts={result.prompts.map(prompt => ({...prompt,creatorSlug:names[prompt.creatorId] ?? "",creatorAvatarUrl:avatars[prompt.creatorId] ?? "",creatorBadges:badges[prompt.creatorId]??[]}))} />;
}
