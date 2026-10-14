export type MindUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  backend?: "firebase" | "supabase";
  getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }>;
};
let native = false;
export const usingSupabase = () => native;
export function setNativeBackend(value: boolean) { native = value; }
export function selectNativeSession(publicId: string) {
  localStorage.setItem("mind-native-session", "1");
  localStorage.setItem("mind-migrated-public-id", publicId);
  window.dispatchEvent(new Event("mind:session"));
}
