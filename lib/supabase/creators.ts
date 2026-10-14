import { requireSupabaseClient } from "./client";
import { normalizeUsername, USERNAME_PATTERN, USERNAME_HINT } from "@/lib/usernames";
import { usingSupabase, type MindUser } from "@/lib/backend";
import { requireFirebaseServices } from "@/lib/firebase/client";
import type { BadgeKind } from "@/lib/firebase/badges";
export type CreatorSearchResult = { public_id: string; username: string; name: string; headline: string; avatar_url: string; badges: BadgeKind[] };
export async function getUsername(publicId: string) {
  const { data, error } = await requireSupabaseClient().from("mind_usernames").select("username").eq("public_id",publicId).maybeSingle();
  if (error) throw error;
  return data?.username as string | undefined;
}
export async function resolveUsername(value: string) {
  const username = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(username)) return null;
  const { data, error } = await requireSupabaseClient().from("mind_usernames").select("public_id").eq("username",username).maybeSingle();
  if (error) throw error;
  return (data?.public_id as string | undefined) ?? null;
}
export async function isUsernameAvailable(value: string, publicId: string) {
  const username = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(username)) return false;
  const { data, error } = await requireSupabaseClient().from("mind_usernames").select("public_id").eq("username",username).maybeSingle();
  if (error) throw error;
  return !data || data.public_id === publicId;
}
export async function searchCreators(value: string, signal: AbortSignal) {
  const { data, error } = await requireSupabaseClient().rpc("mind_search_creators",{ search_term: value.slice(0,80) }).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as CreatorSearchResult[];
}
export function usernameErrorMessage(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "23505" || message.startsWith("Este @")) return "Este @ já está em uso. Escolha outro.";
  if (message.startsWith("Use de 3") || message.startsWith("Sua conta já foi migrada") || message.startsWith("Entre novamente")) return message;
  return "Não foi possível salvar seu @. Confira a conexão e tente novamente.";
}
export async function claimUsername(user: MindUser, value: string) {
  const username = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(username)) throw new Error(USERNAME_HINT);
  if (usingSupabase()) {
    const { error } = await requireSupabaseClient().rpc("mind_set_username",{ username_value: username });
    if (error) throw error;
  } else {
    const current = requireFirebaseServices().auth.currentUser;
    if (!current || current.uid !== user.uid) throw new Error("Entre novamente na conta.");
    const { error } = await requireSupabaseClient().functions.invoke("sync-creator-profile",{ headers: { Authorization: `Bearer ${await current.getIdToken()}` }, body: { usernameOnly: true, username } });
    if (error) {
      const response = "context" in error ? error.context : null;
      if (response instanceof Response) { const body = await response.json().catch(() => null); if (body?.error) throw new Error(body.error); }
      throw error;
    }
  }
  window.dispatchEvent(new Event("mind:username"));
  return username;
}
