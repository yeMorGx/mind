import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireFirebaseServices } from "./client";
import { usingSupabase } from "@/lib/backend";
import { assignNativeBadges, getNativeBadges } from "@/lib/supabase/mind";

export const badgeKinds = ["owner", "verified", "moderator", "creator", "partner"] as const;
export type BadgeKind = typeof badgeKinds[number];
export const badgeInfo: Record<BadgeKind, { label: string; icon: string; color: string; background: string; description: string }> = {
  owner: { label: "Fundador do Mind", icon: "crown", color: "#a66805", background: "#fff3cc", description: "Conta do proprietário do Mind." },
  verified: { label: "Conta verificada", icon: "verified", color: "#1687f8", background: "#e9f4ff", description: "Identidade reconhecida e verificada pela equipe Mind." },
  moderator: { label: "Moderador", icon: "shield_person", color: "#138574", background: "#e0f7f1", description: "Integrante da equipe de moderação." },
  creator: { label: "Criador de conteúdo", icon: "video_camera_front", color: "#7857d7", background: "#f0eaff", description: "Criador de conteúdo reconhecido pela equipe." },
  partner: { label: "Parceiro patrocinado", icon: "handshake", color: "#c55424", background: "#fff0e7", description: "Criador com parceria ou patrocínio confirmado pelo Mind." },
};
export async function getAccountBadges(uid: string): Promise<BadgeKind[]> {
  if (usingSupabase()) return (await getNativeBadges(uid)) ?? [];
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "accountBadges", uid));
  const values = snapshot.data()?.badges;
  return Array.isArray(values) ? badgeKinds.filter(kind => values.includes(kind)) : [];
}
export async function assignAccountBadges(uid: string, badges: BadgeKind[]) {
  if (!uid.trim() || uid.includes("/") || badges.includes("owner")) throw new Error("Informe um UID válido. O selo de fundador exige atribuição administrativa no servidor.");
  if (usingSupabase()) return assignNativeBadges(uid.trim(), badges);
  const { db } = requireFirebaseServices();
  await setDoc(doc(db, "accountBadges", uid.trim()), { badges, updatedAt: serverTimestamp() });
}
