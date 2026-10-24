"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseAuthMessage } from "@/lib/supabase/auth";
import { bootstrapAccount } from "@/lib/supabase/mind";
import { selectNativeSession } from "@/lib/backend";

export default function AuthCallbackPage() {
 const { t } = useI18n();

  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Configure o Supabase para concluir a autenticação.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const authError = params.get("error_description") || params.get("error");
      if (authError) {
        setError(authError.replaceAll("+", " "));
        return;
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data.user) throw new Error("Não foi possível confirmar a conta.");

        const requestedPath = params.get("next");
        if (requestedPath === "/auth/reset-password") {
          router.replace(requestedPath);
          return;
        }
        const {data:activeSession}=await supabase.auth.getSession();
        const returnTo = sessionStorage.getItem("mind-auth-return-to");
        const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(activeSession.session?.access_token);
        if (assurance.error) throw assurance.error;
        if (assurance.data.nextLevel === "aal2" && assurance.data.currentLevel !== "aal2") {
          localStorage.setItem("mind-native-session", "1");
          window.location.replace(returnTo === "/admin" ? "/admin" : "/home");
          return;
        }
        const expected = sessionStorage.getItem("mind-migration-source");
        const account = await bootstrapAccount(expected ?? undefined);
        sessionStorage.removeItem("mind-migration-source");
        sessionStorage.removeItem("mind-native-login-attempt");
        sessionStorage.removeItem("mind-native-login-provider");
        selectNativeSession(account.public_id);
        sessionStorage.removeItem("mind-auth-return-to");
        const destination = returnTo === "/admin" || returnTo === "/home/settings#connections" ? returnTo : "/home/profile";
        window.location.replace(account.onboarding.onboardingComplete ? destination : "/register/step-2");
      } catch (callbackError) {
        const provider=sessionStorage.getItem("mind-native-login-provider");
        const message=callbackError instanceof Error?callbackError.message:"";
        setError(provider&&message.includes("migração autorizada")?"Entre com sua conta original e conecte este provedor nas configurações antes de usá-lo para login.":getSupabaseAuthMessage(callbackError));
      }
    })();
  }, [router]);

  return (
    <main className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-foreground/[0.03] p-8 text-center">
        <p className="text-sm text-subtle">{t("Mind · autenticação")}</p>
        <h1 className="mt-3 text-2xl font-semibold">{error ? t("Não foi possível entrar") : t("Concluindo seu acesso…")}</h1>
        {error ? (
          <>
            <p role="alert" className="mt-4 text-sm leading-6 text-red-700">{t(error)}</p>
            <Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground">{t("Voltar ao Mind")}</Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">{t("Aguarde enquanto confirmamos sua conta.")}</p>
        )}
      </div>
    </main>
  );
}
