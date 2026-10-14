import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { requireFirebaseServices } from "./client";

/** Export only the current user's data; credentials and passwords are never included. */
export async function exportOwnFirebaseData() {
  const services = requireFirebaseServices();
  const user = services.auth.currentUser;
  if (!user) throw new Error("Entre na sua conta antes de baixar o backup.");
  const uid = user.uid;
  const profile = await getDoc(doc(services.db, "users", uid));
  const values = profile.data() ?? {};
  const workspaceId = typeof values.primaryWorkspaceId === "string" ? values.primaryWorkspaceId : "";
  let workspace: Record<string, unknown> | null = null;
  let prompts: Array<{ id: string; data: Record<string, unknown> }> = [];
  if (workspaceId) {
    const result = await getDoc(doc(services.db, "workspaces", workspaceId));
    if (!result.exists() || result.data().ownerId !== uid) throw new Error("Não foi possível confirmar o acesso à sua biblioteca. Tente novamente.");
    workspace = result.data();
    const records = await getDocs(collection(services.db, "workspaces", workspaceId, "prompts"));
    prompts = records.docs.map(record => ({ id: record.id, data: record.data() }));
  }
  if (services.auth.currentUser?.uid !== uid) throw new Error("Sua sessão mudou durante o backup. Entre na conta novamente.");
  return {
    format: "mind-firebase-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    account: { firebaseUid: uid, email: user.email, emailVerified: user.emailVerified, displayName: user.displayName },
    profile: values,
    workspace: workspace ? { id: workspaceId, data: workspace } : null,
    prompts,
  };
}

export async function downloadOwnFirebaseBackup() {
  const data = await exportOwnFirebaseData();
  // Firestore timestamps include their serialized seconds/nanoseconds in JSON.
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mind-backup-${data.account.firebaseUid}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return data.prompts.length;
}
