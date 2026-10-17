import { createClient } from "@supabase/supabase-js";
import { getPublicCreatorProfile } from "./server-data";
import type { CatalogResource, Resource, ResourceKind } from "@/lib/resources";
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("O catálogo não está configurado.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
async function enrich(rows: Resource[]): Promise<CatalogResource[]> {
  const profiles = new Map(
    await Promise.all(
      [...new Set(rows.map((row) => row.creator_id))].map(
        async (id) => [id, await getPublicCreatorProfile(id)] as const,
      ),
    ),
  );
  return rows.map((row) => ({
    ...row,
    creator: profiles.get(row.creator_id) ?? { name: "Criador Mind" },
  }));
}
export async function getPublicResources(
  kind?: ResourceKind,
  query = "",
  creatorId?: string,
) {
  let request = client()
    .from("mind_resources")
    .select("*")
    .eq("status", "published");
  if (kind) request = request.eq("kind", kind);
  if (creatorId) request = request.eq("creator_id", creatorId);
  if (query.trim()) {
    const { data: matches, error } = await client().rpc(
      "mind_search_resources",
      { search_term: query, resource_kind: kind ?? null, result_limit: 100 },
    );
    if (error) throw error;
    if (!matches?.length) return [];
    request = request.in(
      "id",
      matches.map((row: { id: string }) => row.id),
    );
  }
  const { data, error } = await request
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return enrich((data ?? []) as Resource[]);
}
export async function getPublicResource(
  id: string,
): Promise<CatalogResource | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  const { data, error } = await client()
    .from("mind_resources")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? (await enrich([data as Resource]))[0] : null;
}
