import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { usingSupabase, type MindUser as User } from "@/lib/backend";
import * as native from "@/lib/supabase/mind";
import { isSupabaseConfigured, requireSupabaseClient } from "@/lib/supabase/client";
import { requireFirebaseServices } from "./client";
import { getPrompt, type Prompt } from "./data";
import type { Prompt as PublicPrompt } from "@/lib/supabase/types";
import { getAccountBadges, type BadgeKind } from "./badges";

export type CreatorProfile = { name: string; bio: string; headline?: string; avatarUrl?: string; bannerUrl?: string; badges?: BadgeKind[]; backend?: "supabase" | "directory" };
function imageValue(value: unknown) {
  return typeof value === "string" && value.length <= 80000 && /^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(value) ? value : "";
}
function readProfile(value: Record<string, unknown>): CreatorProfile {
  return { name: String(value.name ?? "").slice(0, 80), bio: String(value.bio ?? "").slice(0, 1000),
    headline: String(value.headline ?? "").slice(0, 100), avatarUrl: imageValue(value.avatarUrl), bannerUrl: imageValue(value.bannerUrl) };
}
export async function getOwnProfile(uid: string): Promise<CreatorProfile | null> {
  if (usingSupabase()) return native.getNativeOwnProfile();
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "users", uid));
  const value = snapshot.data()?.creatorProfile;
  return value ? { ...readProfile(value), badges: await getAccountBadges(uid).catch(() => []) } : null;
}
export function profileSaveErrorMessage(error: unknown): string {
  const cause = error;
  const code = typeof cause === "object" && cause !== null && "code" in cause ? String(cause.code).replace(/^firestore\//, "") : "";
  if (code === "permission-denied") return "O site não permitiu salvar seu perfil público. A administração precisa conferir as permissões da conta.";
  if (code === "unauthenticated") return "Sua sessão expirou. Entre novamente na conta e tente salvar.";
  if (code === "unavailable" || code === "deadline-exceeded") return "Não foi possível conectar ao serviço. Confira sua conexão e tente novamente.";
  if (code === "resource-exhausted") return "O serviço está temporariamente sem capacidade para salvar. Tente novamente mais tarde.";
  if (cause instanceof Error && cause.message.startsWith("Informe")) return cause.message;
  if (cause instanceof Error && (cause.message.startsWith("Sua conta já foi migrada") || cause.message.startsWith("Não foi possível atualizar") || cause.message.startsWith("Entre novamente"))) return cause.message;
  return "Não foi possível salvar o perfil. Tente novamente.";
}
export async function saveCreatorProfile(uid: string, profile: CreatorProfile) {
  const name = profile.name.trim(), bio = profile.bio.trim();
  if (!name || name.length > 80 || bio.length > 1000) throw new Error("Informe um nome de até 80 caracteres e uma bio de até 1.000.");
  if (usingSupabase()) return native.saveNativeProfile({ name, bio, headline: (profile.headline ?? "").trim().slice(0,100), avatarUrl: imageValue(profile.avatarUrl), bannerUrl: imageValue(profile.bannerUrl) });
  const { db } = requireFirebaseServices();
  const values = { name, bio, headline: (profile.headline ?? "").trim().slice(0, 100), avatarUrl: imageValue(profile.avatarUrl), bannerUrl: imageValue(profile.bannerUrl) };
  const userRef = doc(db, "users", uid);
  if (isSupabaseConfigured) {
    await syncLegacyProfile(uid, values);
    await setDoc(userRef, { creatorProfile: { ...values, published: true } }, { merge: true });
    return;
  }
  const batch = writeBatch(db);
  // Keep the legacy flag true for compatibility with the deployed Firestore rules.
  batch.set(userRef, { creatorProfile: { ...values, published: true } }, { merge: true });
  batch.set(doc(db, "creatorProfiles", uid), { ...values, published: true, creatorId: uid, updatedAt: serverTimestamp() });
  await batch.commit();
}
export async function ensureCreatorProfile(user: User) {
  if (usingSupabase()) { await native.bootstrapAccount(); return; }
  if (isSupabaseConfigured) {
    const profile = await getOwnProfile(user.uid);
    await syncLegacyProfile(user.uid, profile ?? { name: user.displayName || "Criador Mind", bio: "", avatarUrl: user.photoURL || "" }, true);
    return;
  }
  const { db } = requireFirebaseServices();
  const userRef = doc(db, "users", user.uid);
  const publicRef = doc(db, "creatorProfiles", user.uid);
  // Only initialize missing profiles; never overwrite edits from another tab.
  await runTransaction(db, async transaction => {
    const privateSnapshot = await transaction.get(userRef);
    const stored = privateSnapshot.data();
    if (stored?.creatorProfile?.published === true) return;
    const values = readProfile(stored?.creatorProfile ?? {
      name: stored?.name || user.displayName || "Criador Mind", bio: "", avatarUrl: user.photoURL || "",
    });
    if (!values.name.trim()) values.name = "Criador Mind";
    transaction.set(userRef, { creatorProfile: { ...values, published: true } }, { merge: true });
    transaction.set(publicRef, { ...values, published: true, creatorId: user.uid, updatedAt: serverTimestamp() });
  });
}
async function syncLegacyProfile(uid: string, profile: CreatorProfile, ensure = false) {
  const user = requireFirebaseServices().auth.currentUser;
  if (!user || user.uid !== uid) throw new Error("Entre novamente na sua conta.");
  const { error } = await requireSupabaseClient().functions.invoke("sync-creator-profile", {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` }, body: { profile, ensure },
  });
  if (error) {
    const response = "context" in error ? error.context : null;
    if (response instanceof Response) {
      const body = await response.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw new Error("Não foi possível atualizar o perfil público. Tente novamente.");
  }
}
export async function setPromptPublication(workspaceId: string, uid: string, promptId: string, published: boolean) {
  if (usingSupabase()) return native.publishNativePrompt(workspaceId, promptId, published);
  const { db, auth } = requireFirebaseServices();
  const prompt = await getPrompt(workspaceId, promptId);
  if (!prompt) throw new Error("Prompt não encontrado.");
  if (published) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error("Entre novamente na conta para publicar este prompt.");
    await ensureCreatorProfile(auth.currentUser);
  }
  const batch = writeBatch(db);
  const publicRef = doc(db, "publicPrompts", `${uid}_${promptId}`);
  if (published) batch.set(publicRef, {
    creatorId: uid, workspaceId, promptId, published: true,
    title: prompt.title, content: prompt.content, description: prompt.description,
    model: prompt.model, category: prompt.category, images: prompt.images,
    createdAt: prompt.createdAt ?? Date.now(), updatedAt: Date.now(),
  });
  else batch.delete(publicRef);
  batch.update(doc(db, "workspaces", workspaceId, "prompts", promptId), { isPublished: published });
  await batch.commit();
}
export async function getPublicCreator(uid: string): Promise<CreatorProfile | null> {
  if (isSupabaseConfigured) {
    const migrated = await native.getNativePublicCreator(uid);
    if (migrated) return migrated;
  }
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "creatorProfiles", uid));
  return snapshot.exists() ? { ...readProfile(snapshot.data()), badges: await getAccountBadges(uid).catch(() => []) } : null;
}
function asPublicPrompt(record: Record<string, unknown>, profile: CreatorProfile): PublicPrompt {
  return {
    id: String(record.promptId), slug: String(record.promptId), creatorId: String(record.creatorId),
    creatorName: profile.name, creatorSlug: "", title: String(record.title), content: String(record.content),
    description: String(record.description ?? ""), category: String(record.category ?? ""), model: String(record.model ?? ""),
    status: "published", isFavorite: false, createdAt: Number(record.createdAt), updatedAt: Number(record.updatedAt),
    images: ((record.images ?? []) as Prompt["images"]).map((image, position) => ({ ...image, position, path: "" })),
  };
}
export async function getCreatorPrompts(uid: string, profile: CreatorProfile) {
  if (profile.backend === "supabase") return native.getNativePublicPrompts(uid, profile);
  const { db } = requireFirebaseServices();
  if (profile.backend === "directory") {
    const legacy = await getDoc(doc(db, "creatorProfiles", uid)).catch(error => {
      if (error.code === "permission-denied") return null;
      throw error;
    });
    if (!legacy?.exists() || legacy.data().published !== true) return [];
  }
  const result = await getDocs(query(collection(db, "publicPrompts"), where("creatorId", "==", uid), where("published", "==", true)));
  return result.docs.map(snapshot => asPublicPrompt(snapshot.data(), profile));
}
export async function getSharedPrompt(uid: string, promptId: string, profile: CreatorProfile) {
  if (profile.backend === "supabase") return (await native.getNativePublicPrompts(uid, profile, promptId))[0] ?? null;
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "publicPrompts", `${uid}_${promptId}`));
  return snapshot.exists() && snapshot.data().published ? asPublicPrompt(snapshot.data(), profile) : null;
}
