import type { Metadata } from "next";
import ExploreCatalog from "@/components/catalog/ExploreCatalog";
import { getPublicPrompts, getPublicUsernames } from "@/lib/supabase/server-data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explorar prompts · Mind" };
export default async function Page() {
  const result = await getPublicPrompts(60).then(prompts => ({ prompts, loadFailed: false })).catch(() => ({ prompts: [], loadFailed: true }));
  const names = await getPublicUsernames(result.prompts.map(prompt => prompt.creatorId)).catch(() => ({} as Record<string,string>));
  return <ExploreCatalog {...result} prompts={result.prompts.map(prompt => ({...prompt,creatorSlug:names[prompt.creatorId] ?? ""}))} />;
}
