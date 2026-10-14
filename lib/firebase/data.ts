import { usingSupabase, type MindUser as User } from "@/lib/backend";
import * as native from "@/lib/supabase/mind";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { requireFirebaseServices } from "./client";
import { emptyPromptDetails, readPromptDetails, validatePromptDetails, type PromptDetails } from "@/lib/prompt-media";

export type OnboardingData = {
  name: string;
  email: string;
  role: string;
  source: string;
  usageType: "individual" | "team" | "";
  teamName: string;
  teamSize: string;
  invitedEmails: string[];
  workspaceName: string;
  workspaceIcon: string;
  primaryWorkspaceId: string;
  onboardingComplete: boolean;
};

export type Prompt = PromptDetails & {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  isPublished: boolean;
  createdAt: number | null;
  updatedAt: number | null;
};

export async function saveOnboardingProgress(
  user: User,
  values: Partial<OnboardingData>,
) {
  if (usingSupabase()) return native.saveNativeOnboarding(values);
  const { db } = requireFirebaseServices();
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email ?? "",
      ...values,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createWorkspaceForUser(
  user: User,
  data: OnboardingData,
) {
  if (!data.role) throw new Error("Volte e escolha uma profissão.");
  if (!data.usageType) throw new Error("Volte e escolha como você pretende usar o Mind.");
  if (data.usageType === "team" && !data.teamName.trim()) {
    throw new Error("Volte e informe o nome da equipe.");
  }
  if (!data.workspaceName.trim()) throw new Error("Digite um nome para o workspace.");
  if (usingSupabase()) return native.createNativeWorkspace(user, data);

  const { db } = requireFirebaseServices();
  const workspaceRef = doc(collection(db, "workspaces"));
  const userRef = doc(db, "users", user.uid);
  const workspaceName = data.workspaceName.trim();
  const slug = workspaceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const invitedEmails =
    data.usageType === "team"
      ? [...new Set(data.invitedEmails.map((email) => email.trim().toLowerCase()).filter(Boolean))]
      : [];

  const batch = writeBatch(db);
  batch.set(workspaceRef, {
    id: workspaceRef.id,
    ownerId: user.uid,
    name: workspaceName,
    slug: slug || "workspace",
    icon: data.workspaceIcon,
    usageType: data.usageType,
    teamName: data.teamName.trim(),
    teamSize: data.teamSize,
    invitedEmails,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    userRef,
    {
      ...data,
      name: data.name.trim(),
      workspaceName,
      primaryWorkspaceId: workspaceRef.id,
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
  return workspaceRef.id;
}

export async function getWorkspace(workspaceId: string) {
  if (usingSupabase()) return native.getNativeWorkspace(workspaceId);
  const { db } = requireFirebaseServices();
  const workspace = await getDoc(doc(db, "workspaces", workspaceId));
  return workspace.exists() ? workspace.data() : null;
}

export function subscribeToPrompts(
  workspaceId: string,
  onPrompts: (prompts: Prompt[]) => void,
  onError: (error: Error) => void,
) {
  if (usingSupabase()) return native.subscribeNativePrompts(workspaceId, onPrompts, onError);
  const { db } = requireFirebaseServices();
  const promptsQuery = query(
    collection(db, "workspaces", workspaceId, "prompts"),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(
    promptsQuery,
    (snapshot) => {
      onPrompts(
        snapshot.docs.map((promptDoc) => {
          const prompt = promptDoc.data();
          return {
            id: promptDoc.id,
            title: String(prompt.title ?? ""),
            content: String(prompt.content ?? ""),
            isFavorite: Boolean(prompt.isFavorite),
            isPublished: Boolean(prompt.isPublished),
            createdAt: (prompt.createdAt as Timestamp | undefined)?.toMillis() ?? null,
            updatedAt: (prompt.updatedAt as Timestamp | undefined)?.toMillis() ?? null,
            ...readPromptDetails(prompt),
          };
        }),
      );
    },
    onError,
  );
}

export async function getPrompt(workspaceId: string, promptId: string): Promise<Prompt | null> {
  if (usingSupabase()) return native.getNativePrompt(workspaceId, promptId);
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "workspaces", workspaceId, "prompts", promptId));
  if (!snapshot.exists()) return null;
  const prompt = snapshot.data();
  return {
    id: snapshot.id,
    title: String(prompt.title ?? ""),
    content: String(prompt.content ?? ""),
    isFavorite: Boolean(prompt.isFavorite),
    isPublished: Boolean(prompt.isPublished),
    createdAt: (prompt.createdAt as Timestamp | undefined)?.toMillis() ?? null,
    updatedAt: (prompt.updatedAt as Timestamp | undefined)?.toMillis() ?? null,
    ...readPromptDetails(prompt),
  };
}

export async function createPrompt(
  workspaceId: string,
  userId: string,
  title: string,
  content: string,
  details: PromptDetails = emptyPromptDetails,
) {
  if (usingSupabase()) return native.createNativePrompt(workspaceId, userId, title, content, details);
  const { db } = requireFirebaseServices();
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Preencha o título e o conteúdo do prompt.");
  }
  validatePromptDetails(trimmedTitle, trimmedContent, details);

  const created = await addDoc(collection(db, "workspaces", workspaceId, "prompts"), {
    title: trimmedTitle,
    content: trimmedContent,
    ...details,
    createdBy: userId,
    isFavorite: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function setPromptFavorite(
  workspaceId: string,
  promptId: string,
  isFavorite: boolean,
) {
  if (usingSupabase()) return native.favoriteNativePrompt(workspaceId, promptId, isFavorite);
  const { db } = requireFirebaseServices();
  await updateDoc(doc(db, "workspaces", workspaceId, "prompts", promptId), {
    isFavorite,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePrompt(
  workspaceId: string,
  promptId: string,
  title: string,
  content: string,
  details?: PromptDetails,
) {
  if (usingSupabase()) return native.updateNativePrompt(workspaceId, promptId, title, content, details);
  const { db } = requireFirebaseServices();
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Preencha o título e o conteúdo do prompt.");
  }
  validatePromptDetails(trimmedTitle, trimmedContent, details ?? emptyPromptDetails);

  const existing = await getPrompt(workspaceId, promptId);
  const values = {
    title: trimmedTitle,
    content: trimmedContent,
    ...(details ?? {}),
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.update(doc(db, "workspaces", workspaceId, "prompts", promptId), values);
  if (existing?.isPublished) {
    const workspace = await getWorkspace(workspaceId);
    batch.update(doc(db, "publicPrompts", `${workspace?.ownerId}_${promptId}`), {
      title: trimmedTitle, content: trimmedContent, ...(details ?? {}), updatedAt: Date.now(),
    });
  }
  await batch.commit();
}

export async function removePrompt(workspaceId: string, promptId: string) {
  if (usingSupabase()) return native.removeNativePrompt(workspaceId, promptId);
  const { db } = requireFirebaseServices();
  const existing = await getPrompt(workspaceId, promptId);
  const batch = writeBatch(db);
  batch.delete(doc(db, "workspaces", workspaceId, "prompts", promptId));
  if (existing?.isPublished) {
    const workspace = await getWorkspace(workspaceId);
    batch.delete(doc(db, "publicPrompts", `${workspace?.ownerId}_${promptId}`));
  }
  await batch.commit();
}
