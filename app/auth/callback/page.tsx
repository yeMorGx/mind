"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseAuthMessage } from "@/lib/supabase/auth";
import { bootstrapAccount } from "@/lib/supabase/mind";
import { selectNativeSession } from "@/lib/backend";

export default function AuthCallbackPage() {
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
        const expected = sessionStorage.getItem("mind-migration-source");
        const account = await bootstrapAccount(expected ?? undefined);
        sessionStorage.removeItem("mind-migration-source");
        selectNativeSession(account.public_id);
        window.location.replace(account.onboarding.onboardingComplete ? "/home/profile" : "/register/step-2");
      } catch (callbackError) {
        setError(getSupabaseAuthMessage(callbackError));
      }
    })();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm text-white/45">Mind · autenticação</p>
        <h1 className="mt-3 text-2xl font-semibold">{error ? "Não foi possível entrar" : "Concluindo seu acesso…"}</h1>
        {error ? (
          <>
            <p role="alert" className="mt-4 text-sm leading-6 text-red-200">{error}</p>
            <Link href="/" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-medium text-black">Voltar ao Mind</Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-white/50">Aguarde enquanto confirmamos sua conta.</p>
        )}
      </div>
    </main>
  );
}
