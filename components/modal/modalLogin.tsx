"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import type { Provider } from "@supabase/supabase-js";
import Logo from "@/components/ui/logo";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ensureUserProfile, getAuthDestination, getSupabaseAuthMessage } from "@/lib/supabase/auth";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const redirectUrl = (path: string) =>
  `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;

export default function LoginModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const { supabaseConfigured } = useOnboarding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseClient();
    setError("");
    setNotice("");
    if (!supabase) {
      setError("Configure o Supabase no arquivo .env.local.");
      return;
    }

    setPending(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      if (!data.user) throw new Error("Não foi possível confirmar a conta.");
      await ensureUserProfile(data.user);
      const destination = await getAuthDestination(data.user);
      onClose();
      router.push(destination);
    } catch (signInError) {
      setError(getSupabaseAuthMessage(signInError));
    } finally {
      setPending(false);
    }
  }

  async function handleOAuth(provider: Extract<Provider, "google" | "discord">) {
    const supabase = getSupabaseClient();
    setError("");
    setNotice("");
    if (!supabase) {
      setError("Configure o Supabase no arquivo .env.local.");
      return;
    }

    setPending(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl("/home") },
      });
      if (oauthError) throw oauthError;
    } catch (oauthError) {
      setError(getSupabaseAuthMessage(oauthError));
      setPending(false);
    }
  }

  async function handlePasswordReset() {
    const supabase = getSupabaseClient();
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Digite seu e-mail para receber o link de redefinição.");
      return;
    }
    if (!supabase) {
      setError("Configure o Supabase no arquivo .env.local.");
      return;
    }

    setPending(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: redirectUrl("/auth/reset-password") },
      );
      if (resetError) throw resetError;
      setNotice("Se houver uma conta com esse e-mail, enviaremos um link para redefinir a senha.");
    } catch (resetError) {
      setError(getSupabaseAuthMessage(resetError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Fechar janela de login"
            className="fixed inset-0 z-40 cursor-default bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <div className="my-auto grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-[#080808] shadow-2xl md:grid-cols-[1fr_1fr]">
              <div className="flex flex-col justify-center border-b border-white/10 p-7 sm:p-10 md:border-b-0 md:border-r lg:p-14">
                <Logo />
                <p className="mt-8 text-sm text-white/45">Mind para criadores de IA</p>
                <h1 id="login-modal-title" className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
                  Compartilhe o prompt por trás da imagem.
                </h1>
                <p className="mt-5 max-w-md leading-7 text-white/55">
                  Entre para publicar seus prompts, mostrar os resultados e enviar uma página pronta para seus seguidores.
                </p>
              </div>

              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={pending || !supabaseConfigured}
                    onClick={() => void handleOAuth("google")}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FcGoogle size={22} />
                    Continuar com Google
                  </button>
                  <button
                    type="button"
                    disabled={pending || !supabaseConfigured}
                    onClick={() => void handleOAuth("discord")}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] py-3.5 font-medium text-white transition hover:bg-[#4f5bd5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaDiscord size={20} />
                    Continuar com Discord
                  </button>
                  <div className="flex items-center gap-4 py-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-sm text-white/40">ou com e-mail</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <form onSubmit={(event) => void handleEmailSignIn(event)} className="space-y-3">
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="E-mail"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white outline-none transition focus:border-white/30 focus:bg-white/[0.05]"
                    />
                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Senha"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white outline-none transition focus:border-white/30 focus:bg-white/[0.05]"
                    />
                    {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}
                    {notice && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-100">{notice}</p>}
                    {!supabaseConfigured && <p className="text-sm text-amber-100/80">Configure as variáveis do Supabase para habilitar o login.</p>}
                    <button
                      type="submit"
                      disabled={pending || !supabaseConfigured}
                      className="w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pending ? "Aguarde..." : "Entrar"}
                    </button>
                  </form>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
                    <button type="button" disabled={pending} onClick={() => void handlePasswordReset()} className="text-white/45 transition hover:text-white">
                      Esqueci minha senha
                    </button>
                    <button type="button" onClick={() => { onClose(); router.push("/register"); }} className="text-white/65 transition hover:text-white">
                      Criar conta
                    </button>
                  </div>
                </div>
                <p className="mt-8 text-center text-xs leading-5 text-white/30">
                  Ao entrar, você concorda com os termos e a política de privacidade do Mind.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
