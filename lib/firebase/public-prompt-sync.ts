import { requireFirebaseServices } from "./client";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function syncLegacyPrompt(workspaceId: string, promptId: string, published: boolean) {
  const user = requireFirebaseServices().auth.currentUser;
  if (!user) throw new Error("Entre novamente na conta para publicar o prompt.");
  const { error } = await requireSupabaseClient().functions.invoke("sync-prompt-publication", {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` }, body: { workspaceId, promptId, published },
  });
  if (error) {
    const response = "context" in error ? error.context : null;
    if (response instanceof Response) {
      const body = await response.json().catch(() => null);
      if (typeof body?.error === "string") throw new Error(body.error);
    }
    throw new Error("Não foi possível alterar a publicação. Confira sua conexão e tente novamente.");
  }
}
