import catalog from "@/examples/resources/catalog.json";
import type { MindUser } from "@/lib/backend";
import { ensureCreatorProfile } from "@/lib/firebase/publication";
import { listOwnResources, saveResource } from "@/lib/supabase/resources";
import { validateResource, type Resource, type ResourceDocument, type ResourceKind } from "@/lib/resources";

export const resourceExamples = catalog.resources.map(item => ({
  id: item.id,
  kind: item.kind as ResourceKind,
  document: item.document as ResourceDocument,
}));
export type ExampleImportResult = { exampleId: string; resourceId: string; status: Resource["status"]; created: boolean };

async function accountExampleId(publicId: string, exampleId: string) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`mind-resource-example-v1:${publicId}:${exampleId}`)));
  const bytes = hash.slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 128;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Called only by the signed-in user's explicit publication action. */
export async function publishResourceExamples(user: MindUser, onProgress: (results: ExampleImportResult[]) => void) {
  for (const example of resourceExamples) validateResource(example.kind, example.document, true);
  await ensureCreatorProfile(user);
  const own = new Map((await listOwnResources(user)).map(item => [item.id, item]));
  const results: ExampleImportResult[] = [];
  for (const example of resourceExamples) {
    const id = await accountExampleId(user.uid, example.id);
    let existing = own.get(id);
    let created = false;
    if (!existing) {
      try {
        existing = await saveResource(user, { id, kind: example.kind, document: example.document, status: "published" });
        created = true;
      } catch (error) {
        // A retry or another tab may already have created the same account-specific item.
        existing = (await listOwnResources(user)).find(item => item.id === id);
        if (!existing) throw error;
      }
    }
    results.push({ exampleId: example.id, resourceId: id, status: existing.status, created });
    onProgress([...results]);
  }
  return results;
}
