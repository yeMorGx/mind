"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { createEmailPasswordAccount, getSupabaseAuthMessage } from "@/lib/supabase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { data, updateData, user, authReady, profileLoading, supabaseConfigured } = useOnboarding();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!authReady || !user || profileLoading) return;
    if (data.onboardingComplete) router.replace("/home");
    else if (!data.role) router.replace("/register/step-2");
    else if (!data.usageType) router.replace("/register/step-4");
    else if (data.usageType === "team" && !data.teamName) router.replace("/register/step-5");
    else router.replace("/register/step-7");
  }, [authReady, data, profileLoading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!name.trim()) {
      setError("Digite seu nome.");
      return;
    }
    setPending(true);

    try {
      const result = await createEmailPasswordAccount(name, email, password);
      if (result.requiresEmailConfirmation) {
        setNotice("Enviamos um link para confirmar seu e-mail. Abra a mensagem para continuar o cadastro.");
        return;
      }
      if (!result.user) throw new Error("Não foi possível criar sua conta.");
      updateData({ name: name.trim(), email: result.user.email ?? email.trim() });
      router.push("/register/step-2");
    } catch (submitError) {
      setError(getSupabaseAuthMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <OnboardingLayout step={1}>
      <h1 className="text-4xl font-bold">Crie sua conta</h1>
      <p className="mt-2 text-white/60">
        Vamos começar com algumas informações.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-4 outline-none focus:border-white/30"
        />
        <input
          autoComplete="email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-4 outline-none focus:border-white/30"
        />
        <input
          autoComplete="new-password"
          required
          minLength={6}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha (mínimo de 6 caracteres)"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-4 outline-none focus:border-white/30"
        />

        {!supabaseConfigured && (
          <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/80">
            Configure as variáveis Supabase no arquivo .env.local para habilitar o cadastro.
          </p>
        )}
        {notice && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100">{notice}</p>}
        {error && (
          <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          disabled={pending || !supabaseConfigured}
          className="mt-4 w-full rounded-xl bg-white py-4 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Criando conta..." : "Continuar"}
        </button>
      </form>
    </OnboardingLayout>
  );
}
