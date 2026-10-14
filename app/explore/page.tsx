import type { Metadata } from "next";
import ExploreCatalog from "@/components/catalog/ExploreCatalog";
import { getPublicPrompts } from "@/lib/supabase/server-data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explorar prompts · Mind" };
export default async function Page() {
  const result = await getPublicPrompts(60).then(prompts => ({ prompts, loadFailed: false })).catch(() => ({ prompts: [], loadFailed: true }));
  return <ExploreCatalog {...result} />;
}
