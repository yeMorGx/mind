import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireFirebaseServices } from "./client";
import { usingSupabase } from "@/lib/backend";
import { assignNativeBadges, getNativeBadges, getNativePublicCreator } from "@/lib/supabase/mind";
import { isSupabaseConfigured } from "@/lib/supabase/client";

import { badgeKinds, type BadgeKind } from "@/lib/badges";
export { badgeKinds, badgeInfo, editableBadgeKinds, type BadgeKind } from "@/lib/badges";

export async function getAccountBadges(uid: string): Promise<BadgeKind[]> {
  if (usingSupabase()) return (await getNativeBadges(uid)) ?? [];
  if (isSupabaseConfigured) {
    const published = await getNativeBadges(uid);
    if (published.length) return published;
    // An existing Supabase profile with an empty set represents an intentional removal.
    if (await getNativePublicCreator(uid)) return [];
  }
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
