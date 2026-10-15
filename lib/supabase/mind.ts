import { getUsername } from "./creators";
import { requireSupabaseClient } from "./client";
import type { Prompt, OnboardingData } from "@/lib/firebase/data";
import type { CreatorProfile } from "@/lib/firebase/publication";
import { readPromptDetails, validatePromptDetails, type PromptDetails } from "@/lib/prompt-media";
import type { MindUser } from "@/lib/backend";

export type NativeAccount = { id: string; public_id: string; onboarding: OnboardingData; creator_profile: CreatorProfile; badge_admin: boolean };
export async function bootstrapAccount(expectedPublicId?: string): Promise<NativeAccount> {
  const { data, error } = await requireSupabaseClient().rpc("mind_bootstrap_account", { expected_public_id: expectedPublicId ?? null });
  if (error) throw new Error(error.message);
  return data as NativeAccount;
}
/** Restore an existing authenticated session only when the server confirms the same public account. */
export async function restoreNativeAccount(publicId: string): Promise<NativeAccount | null> {
  const { data, error } = await requireSupabaseClient().auth.getSession();
  if (error || !data.session) return null;
  try { return await bootstrapAccount(publicId); } catch { return null; }
}
export async function startAccountMigration(user: MindUser) {
  sessionStorage.setItem("mind-migration-source", user.uid);
  const { error } = await requireSupabaseClient().auth.signInWithOAuth({ provider: "google", options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: { prompt: "select_account" },
  } });
  if (error) throw error;
}
function millis(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") { const date = Date.parse(value); return Number.isFinite(date) ? date : null; }
  if (value && typeof value === "object" && "seconds" in value) {
    return Number(value.seconds) * 1000 + Number("nanoseconds" in value ? value.nanoseconds : 0) / 1e6;
  }
  return null;
}
function asPrompt(id: string, data: Record<string, unknown>): Prompt {
  return { id, title: String(data.title ?? ""), content: String(data.content ?? ""), isFavorite: data.isFavorite === true,
    isPublished: data.isPublished === true, createdAt: millis(data.createdAt), updatedAt: millis(data.updatedAt), ...readPromptDetails(data) };
}
async function nativeIdentity() {
  const { data, error } = await requireSupabaseClient().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Entre novamente na conta.");
  return data.user;
}
function changed() { window.dispatchEvent(new Event("mind:prompts")); }
export async function getNativeWorkspace(id: string) {
  const { data, error } = await requireSupabaseClient().from("mind_workspaces").select("document").eq("id", id).maybeSingle();
  if (error) throw error;
  return data?.document ?? null;
}
export async function getNativePrompt(workspace: string, id: string) {
  const { data, error } = await requireSupabaseClient().from("mind_prompts").select("document").eq("workspace_id", workspace).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? asPrompt(id, data.document) : null;
}
export function subscribeNativePrompts(workspace: string, success: (values: Prompt[]) => void, failure: (error: Error) => void) {
  let active = true, request = 0;
  async function load() {
    const current = ++request;
    try {
      const { data, error } = await requireSupabaseClient().from("mind_prompts").select("id,document").eq("workspace_id", workspace);
      if (error) throw error;
      if (active && current === request) success((data ?? []).map(row => asPrompt(row.id, row.document)).sort((a,b) => (b.updatedAt ?? 0)-(a.updatedAt ?? 0)));
    } catch (error) { if (active && current === request) failure(error instanceof Error ? error : new Error("Não foi possível carregar os prompts.")); }
  }
  void load();
  const refresh = () => { if (document.visibilityState === "visible") void load(); };
  const interval = window.setInterval(refresh, 15000);
  window.addEventListener("mind:prompts", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => { active = false; clearInterval(interval); window.removeEventListener("mind:prompts", refresh); document.removeEventListener("visibilitychange", refresh); };
}
export async function createNativePrompt(workspace: string, publicId: string, title: string, content: string, details: PromptDetails) {
  validatePromptDetails(title.trim(), content.trim(), details);
  const user = await nativeIdentity(), id = crypto.randomUUID();
  const { error } = await requireSupabaseClient().from("mind_prompts").insert({ id, workspace_id: workspace, owner_id: user.id,
    document: { title: title.trim(), content: content.trim(), ...details, createdBy: publicId, isFavorite: false, isPublished: false, createdAt: Date.now(), updatedAt: Date.now() } });
  if (error) throw error;
  changed(); return id;
}
async function mutatePrompt(workspace: string, id: string, values: Record<string, unknown>) {
  const existing = await getNativePrompt(workspace, id);
  if (!existing) throw new Error("Prompt não encontrado.");
  const { error } = await requireSupabaseClient().rpc("mind_save_prompt", { workspace, prompt: id, values_json: { ...values, updatedAt: Date.now() } });
  if (error) throw error;
  changed();
}
export async function updateNativePrompt(workspace: string, id: string, title: string, content: string, details?: PromptDetails) {
  const existing = await getNativePrompt(workspace, id);
  if (!existing) throw new Error("Prompt não encontrado.");
  validatePromptDetails(title.trim(), content.trim(), details ?? readPromptDetails(existing));
  await mutatePrompt(workspace,id,{ title: title.trim(), content: content.trim(), ...(details ?? {}) });
}
export const favoriteNativePrompt = (workspace: string,id: string,isFavorite: boolean) => mutatePrompt(workspace,id,{ isFavorite });
export const publishNativePrompt = (workspace: string,id: string,isPublished: boolean) => mutatePrompt(workspace,id,{ isPublished });
export async function removeNativePrompt(workspace: string,id: string) {
  const { error } = await requireSupabaseClient().from("mind_prompts").delete().eq("workspace_id",workspace).eq("id",id);
  if (error) throw error;
  changed();
}
export async function saveNativeOnboarding(values: Partial<OnboardingData>) {
  const account = await bootstrapAccount();
  const { error } = await requireSupabaseClient().from("mind_accounts").update({ onboarding: { ...account.onboarding,...values } }).eq("id",account.id);
  if (error) throw error;
}
export async function createNativeWorkspace(user: MindUser,data: OnboardingData) {
  const identity = await nativeIdentity(), id = crypto.randomUUID();
  const { error } = await requireSupabaseClient().from("mind_workspaces").insert({ id,owner_id:identity.id,document:{ ...data,id,ownerId:user.uid,name:data.workspaceName.trim(),icon:data.workspaceIcon } });
  if (error) throw error;
  await saveNativeOnboarding({ ...data,primaryWorkspaceId:id,onboardingComplete:true });
  return id;
}
export async function getNativeOwnProfile() {
  const account = await bootstrapAccount();
  return { ...account.creator_profile,username:await getUsername(account.public_id),backend:"supabase" as const,badges:await getNativeBadges(account.public_id) };
}
export async function saveNativeProfile(profile: CreatorProfile) {
  const { name,bio,headline="",avatarUrl="",bannerUrl="",username="" } = profile;
  const { error } = await requireSupabaseClient().rpc("mind_save_creator_profile",{ profile_values:{name,bio,headline,avatarUrl,bannerUrl},username_value:username });
  if (error) throw error;
}
export async function getNativeBadges(uid: string): Promise<NonNullable<CreatorProfile["badges"]>> {
  const { data,error } = await requireSupabaseClient().from("mind_badges").select("badges").eq("public_id",uid).maybeSingle();
  if (error) throw error;
  if (data) return data.badges;
  const directory = await requireSupabaseClient().from("mind_creator_directory").select("badges").eq("public_id",uid).maybeSingle();
  if (directory.error) throw directory.error;
  return directory.data?.badges ?? [];
}
export async function assignNativeBadges(uid: string,badges: string[]) {
  const { error } = await requireSupabaseClient().from("mind_badges").upsert({ public_id:uid,badges });
  if (error) throw error;
}
export async function getNativePublicCreator(uid: string): Promise<CreatorProfile|null> {
  const { data,error } = await requireSupabaseClient().from("mind_creators").select("profile").eq("public_id",uid).maybeSingle();
  if (error) throw error;
  if (data) return {...data.profile,username:await getUsername(uid),backend:"supabase",badges:await getNativeBadges(uid)};
  const directory = await requireSupabaseClient().from("mind_creator_directory").select("profile,badges").eq("public_id",uid).maybeSingle();
  if (directory.error) throw directory.error;
  return directory.data ? {...directory.data.profile,username:await getUsername(uid),backend:"directory",badges:directory.data.badges} : null;
}
export async function getNativePublicPrompts(uid: string,profile: CreatorProfile,id?: string) {
  let query = requireSupabaseClient().from("mind_public_prompts").select("prompt_id,document").eq("creator_id",uid);
  if (id) query=query.eq("prompt_id",id);
  const { data,error } = await query;
  if (error) throw error;
  return (data ?? []).map(row => { const prompt=asPrompt(row.prompt_id,row.document);return {
    ...prompt,slug:prompt.id,creatorId:uid,creatorName:profile.name,creatorSlug:profile.username??"",creatorAvatarUrl:profile.avatarUrl,creatorBadges:profile.badges,status:"published" as const,
    createdAt:prompt.createdAt ?? Number.NaN,updatedAt:prompt.updatedAt ?? Number.NaN,
    images:prompt.images.map((image,position)=>({...image,path:"",position})),
  }; });
}
export async function exportNativeBackup() {
  const account=await bootstrapAccount();
  const workspace=await getNativeWorkspace(account.onboarding.primaryWorkspaceId);
  const { data,error }=await requireSupabaseClient().from("mind_prompts").select("id,document").eq("workspace_id",account.onboarding.primaryWorkspaceId);
  if (error) throw error;
  return {format:"mind-supabase-backup",version:1,exportedAt:new Date().toISOString(),account:{supabaseId:account.id,publicId:account.public_id},profile:account.onboarding,creatorProfile:account.creator_profile,
    workspace:workspace?{id:account.onboarding.primaryWorkspaceId,data:workspace}:null,prompts:(data??[]).map(row=>({id:row.id,data:row.document}))};
}
