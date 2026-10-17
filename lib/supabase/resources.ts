import { requireSupabaseClient } from "./client";
import { usingSupabase, type MindUser } from "@/lib/backend";
import { requireFirebaseServices } from "@/lib/firebase/client";
import {
  validateResource,
  type Resource,
  type ResourceDocument,
  type ResourceKind,
} from "@/lib/resources";
async function legacy(
  action: string,
  body: Record<string, unknown>,
  user: MindUser,
) {
  const identity = requireFirebaseServices().auth.currentUser;
  if (!identity || identity.uid !== user.uid)
    throw new Error("Entre novamente na sua conta.");
  const { data, error } = await requireSupabaseClient().functions.invoke(
    "resource-actions",
    {
      headers: { Authorization: `Bearer ${await identity.getIdToken()}` },
      body: { action, ...body },
    },
  );
  if (error) {
    const response = "context" in error ? error.context : null;
    const details =
      response instanceof Response
        ? await response.json().catch(() => null)
        : null;
    throw new Error(
      details?.error ||
        "Não foi possível conectar ao serviço de arquivos e MCPs. Tente novamente em breve.",
    );
  }
  return data;
}
export async function listOwnResources(user: MindUser): Promise<Resource[]> {
  if (!usingSupabase()) return (await legacy("list", {}, user)).resources;
  const { data, error } = await requireSupabaseClient()
    .from("mind_resources")
    .select("*")
    .eq("creator_id", user.uid)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function saveResource(
  user: MindUser,
  value: Pick<Resource, "id" | "kind" | "document" | "status">,
  expectedUpdatedAt?: string,
): Promise<Resource> {
  validateResource(value.kind, value.document, value.status === "published");
  if (!usingSupabase())
    return (await legacy("save", { resource: value, expectedUpdatedAt }, user))
      .resource;
  const client = requireSupabaseClient();
  const request = expectedUpdatedAt
    ? client
        .from("mind_resources")
        .update({ document: value.document, status: value.status })
        .eq("id", value.id)
        .eq("creator_id", user.uid)
        .eq("updated_at", expectedUpdatedAt)
    : client.from("mind_resources").insert({ ...value, creator_id: user.uid });
  const { data, error } = await request.select().maybeSingle();
  if (!error && !data)
    throw new Error(
      "Esta publicação foi alterada em outra aba. Reabra a edição para atualizar os dados.",
    );
  if (error) throw error;
  return data;
}
export async function deleteResource(user: MindUser, id: string) {
  if (!usingSupabase()) return legacy("delete", { id }, user);
  const { error } = await requireSupabaseClient()
    .from("mind_resources")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.uid);
  if (error) throw error;
}
export async function ownResource(
  user: MindUser,
  id: string,
): Promise<Resource | null> {
  return (
    (await listOwnResources(user)).find((resource) => resource.id === id) ??
    null
  );
}
export async function setResourceFavorite(
  user: MindUser,
  id: string,
  active: boolean,
) {
  if (!usingSupabase()) return legacy("favorite", { id, active }, user);
  const client = requireSupabaseClient();
  const result = active
    ? await client
        .from("mind_resource_favorites")
        .upsert(
          { actor_id: user.uid, resource_id: id },
          { onConflict: "actor_id,resource_id", ignoreDuplicates: true },
        )
    : await client
        .from("mind_resource_favorites")
        .delete()
        .eq("actor_id", user.uid)
        .eq("resource_id", id);
  if (result.error) throw result.error;
}
export async function readResourceFavorites(user: MindUser): Promise<string[]> {
  if (!usingSupabase()) return (await legacy("favorites", {}, user)).ids;
  const { data, error } = await requireSupabaseClient()
    .from("mind_resource_favorites")
    .select("resource_id")
    .eq("actor_id", user.uid);
  if (error) throw error;
  return (data ?? []).map((row) => row.resource_id);
}
export type ResourceSaveValues = {
  kind: ResourceKind;
  document: ResourceDocument;
};
