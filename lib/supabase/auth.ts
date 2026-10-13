import type { User } from "@supabase/supabase-js";
import { requireSupabaseClient } from "./client";
import type { OnboardingData } from "./types";

export async function createEmailPasswordAccount(
  name: string,
  email: string,
  password: string,
) {
  const supabase = requireSupabaseClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/register/step-2")}`;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: name.trim() },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;

  if (data.session && data.user) {
    await ensureUserProfile(data.user);
  }

  return {
    user: data.user,
    requiresEmailConfirmation: !data.session,
  };
}

export async function ensureUserProfile(user: User) {
  const supabase = requireSupabaseClient();
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.name || metadataName,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getAuthDestination(user: User) {
  const profile = await ensureUserProfile(user);
  if (profile.onboarding_complete) return "/home";
  if (!profile.role) return "/register/step-2";
  if (!profile.usage_type) return "/register/step-4";
  if (profile.usage_type === "team" && !profile.team_name) {
    return "/register/step-5";
  }
  return "/register/step-7";
}

export function getSupabaseAuthMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code).toLowerCase()
      : "";

  if (code.includes("email_exists") || message.includes("already registered")) {
    return "Já existe uma conta com esse e-mail. Tente entrar.";
  }
  if (code.includes("invalid_credentials") || message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (message.includes("password should be at least") || message.includes("weak password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (message.includes("invalid email")) return "Digite um e-mail válido.";
  if (message.includes("provider is not enabled")) {
    return "Este método de login ainda não foi ativado nas configurações do Supabase.";
  }
  if (message.includes("redirect") || message.includes("callback")) {
    return "Confira se o endereço deste site está permitido em Authentication → URL Configuration no Supabase.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a autenticação. Tente novamente.";
}

export function safeAuthRedirect(path: string | null | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/home";
  return path;
}

export type ProfileInput = Pick<
  OnboardingData,
  | "name"
  | "email"
  | "role"
  | "source"
  | "usageType"
  | "teamName"
  | "teamSize"
  | "invitedEmails"
  | "creatorName"
  | "creatorIcon"
  | "creatorSlug"
  | "onboardingComplete"
>;
