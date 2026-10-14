"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getAuthDestination, getSupabaseAuthMessage } from "@/lib/supabase/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Configure o Supabase para alterar a senha.");
      return;
    }

    setPending(true);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      if (!data.user) throw new Error("Não foi possível salvar a nova senha.");
      router.replace(await getAuthDestination(data.user));
    } catch (updateError) {
      setError(getSupabaseAuthMessage(updateError));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background px-6 text-foreground">
      <form onSubmit={(event) => void savePassword(event)} className="w-full max-w-md rounded-3xl border border-border bg-foreground/[0.03] p-8">
        <p className="text-sm text-subtle">Mind · segurança da conta</p>
        <h1 className="mt-3 text-3xl font-semibold">Crie uma nova senha</h1>
        <label htmlFor="new-password" className="mt-7 block text-sm text-muted">Nova senha</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" />
        <label htmlFor="confirm-password" className="mt-4 block text-sm text-muted">Confirme a senha</label>
        <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 outline-none focus:border-foreground/30" />
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={pending} className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Salvando…" : "Salvar nova senha"}</button>
      </form>
    </main>
  );
}
