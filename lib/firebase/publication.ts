import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { requireFirebaseServices } from "./client";
import { getPrompt, type Prompt } from "./data";
import type { Prompt as PublicPrompt } from "@/lib/supabase/types";

export type CreatorProfile = { name: string; bio: string; published: boolean };
export async function getOwnProfile(uid: string): Promise<CreatorProfile | null> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.data()?.creatorProfile ?? null;
}
export async function saveCreatorProfile(uid: string, profile: CreatorProfile) {
  const name = profile.name.trim(), bio = profile.bio.trim();
  if (!name || name.length > 80 || bio.length > 1000) throw new Error("Informe um nome de até 80 caracteres e uma bio de até 1.000.");
  const { db } = requireFirebaseServices();
  const values = { name, bio, published: profile.published };
  const previous = await getOwnProfile(uid);
  if (!profile.published && !previous?.published) {
    await setDoc(doc(db, "users", uid), { creatorProfile: values }, { merge: true });
    return;
  }
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), { creatorProfile: values }, { merge: true });
  if (profile.published) batch.set(doc(db, "creatorProfiles", uid), { ...values, creatorId: uid, updatedAt: serverTimestamp() });
  else batch.delete(doc(db, "creatorProfiles", uid));
  await batch.commit();
}
export async function setPromptPublication(workspaceId: string, uid: string, promptId: string, published: boolean) {
  const { db } = requireFirebaseServices();
  const prompt = await getPrompt(workspaceId, promptId);
  if (!prompt) throw new Error("Prompt não encontrado.");
  const profile = await getOwnProfile(uid);
  if (published && !profile?.published) throw new Error("Publique seu perfil antes de publicar este prompt.");
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
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "creatorProfiles", uid));
  return snapshot.exists() && snapshot.data().published ? snapshot.data() as CreatorProfile : null;
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
  const { db } = requireFirebaseServices();
  const result = await getDocs(query(collection(db, "publicPrompts"), where("creatorId", "==", uid), where("published", "==", true)));
  return result.docs.map(snapshot => asPublicPrompt(snapshot.data(), profile));
}
export async function getSharedPrompt(uid: string, promptId: string, profile: CreatorProfile) {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "publicPrompts", `${uid}_${promptId}`));
  return snapshot.exists() && snapshot.data().published ? asPublicPrompt(snapshot.data(), profile) : null;
}
