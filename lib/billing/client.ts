"use client";
import { usingSupabase, type MindUser } from "@/lib/backend";
import { requireSupabaseClient } from "@/lib/supabase/client";
import { requireFirebaseServices } from "@/lib/firebase/client";
export async function accountHeaders(user: MindUser): Promise<Record<string,string>> {
 if (user.backend === "supabase" || usingSupabase()) {
  const { data, error } = await requireSupabaseClient().auth.getSession();
  if (error || !data.session) throw new Error("Entre novamente na sua conta.");
  return { Authorization: `Bearer ${data.session.access_token}`, "X-Mind-Backend": "supabase" };
 }
 const current = requireFirebaseServices().auth.currentUser;
 if (!current || current.uid !== user.uid) throw new Error("Entre novamente na sua conta.");
 return { Authorization: `Bearer ${await current.getIdToken()}`, "X-Mind-Backend": "firebase" };
}
export async function billingRequest<T>(user: MindUser, action: string, body: Record<string,unknown> = {}): Promise<T> {
 const response = await fetch(`/api/billing/${action}`, { method: "POST", headers: { ...await accountHeaders(user), "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
 const result = await response.json();
 if (!response.ok) throw new Error(result.error || "Não foi possível concluir. Tente novamente.");
 return result;
}
