import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
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

export type Prompt = {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  updatedAt: number | null;
};

export async function saveOnboardingProgress(
  user: User,
  values: Partial<OnboardingData>,
) {
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
  const { db } = requireFirebaseServices();
  const workspace = await getDoc(doc(db, "workspaces", workspaceId));
  return workspace.exists() ? workspace.data() : null;
}

export function subscribeToPrompts(
  workspaceId: string,
  onPrompts: (prompts: Prompt[]) => void,
  onError: (error: Error) => void,
) {
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
            updatedAt: (prompt.updatedAt as Timestamp | undefined)?.toMillis() ?? null,
          };
        }),
      );
    },
    onError,
  );
}

export async function createPrompt(
  workspaceId: string,
  userId: string,
  title: string,
  content: string,
) {
  const { db } = requireFirebaseServices();
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Preencha o título e o conteúdo do prompt.");
  }

  await addDoc(collection(db, "workspaces", workspaceId, "prompts"), {
    title: trimmedTitle,
    content: trimmedContent,
    createdBy: userId,
    isFavorite: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setPromptFavorite(
  workspaceId: string,
  promptId: string,
  isFavorite: boolean,
) {
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
) {
  const { db } = requireFirebaseServices();
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Preencha o título e o conteúdo do prompt.");
  }

  await updateDoc(doc(db, "workspaces", workspaceId, "prompts", promptId), {
    title: trimmedTitle,
    content: trimmedContent,
    updatedAt: serverTimestamp(),
  });
}

export async function removePrompt(workspaceId: string, promptId: string) {
  const { db } = requireFirebaseServices();
  await deleteDoc(doc(db, "workspaces", workspaceId, "prompts", promptId));
}
