import {
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireFirebaseServices } from "./client";

export async function createEmailPasswordAccount(
  name: string,
  email: string,
  password: string,
) {
  const { auth, db } = requireFirebaseServices();
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  await updateProfile(credential.user, { displayName: name.trim() });
  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    name: name.trim(),
    email: credential.user.email,
    role: "",
    source: "",
    usageType: "",
    teamName: "",
    teamSize: "",
    invitedEmails: [],
    workspaceName: "",
    workspaceIcon: "🧠",
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return credential.user;
}

export async function ensureUserProfile(user: User) {
  const { db } = requireFirebaseServices();
  const userRef = doc(db, "users", user.uid);
  const profile = await getDoc(userRef);

  if (!profile.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName ?? "",
      email: user.email ?? "",
      role: "",
      source: "",
      usageType: "",
      teamName: "",
      teamSize: "",
      invitedEmails: [],
      workspaceName: "",
      workspaceIcon: "🧠",
      onboardingComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return profile.exists() ? profile.data() : null;
}

export async function getAuthDestination(user: User) {
  const profile = await ensureUserProfile(user);
  if (profile?.onboardingComplete) return "/home";
  if (!profile?.role) return "/register/step-2";
  if (!profile?.usageType) return "/register/step-4";
  if (profile.usageType === "team" && !profile.teamName) {
    return "/register/step-5";
  }
  return "/register/step-7";
}

export function getFirebaseAuthMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Já existe uma conta com esse e-mail. Tente entrar.";
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";
    case "auth/operation-not-allowed":
      return "Este método de login está temporariamente indisponível. Tente outro método.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.";
    case "auth/network-request-failed":
      return "Não foi possível conectar. Verifique sua conexão e tente novamente.";
    case "auth/popup-closed-by-user":
      return "A janela de autenticação foi fechada antes da conclusão.";
    case "auth/unauthorized-domain":
      return "O login não está disponível neste endereço. Acesse o Mind pelo endereço oficial.";
    default:
      return error instanceof Error
        ? error.message
        : "Não foi possível concluir a autenticação. Tente novamente.";
  }
}
