"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import type { Provider } from "@supabase/supabase-js";
import Logo from "@/components/ui/logo";
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
      setError("O login está temporariamente indisponível. Tente novamente em instantes.");
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
      setError("O login está temporariamente indisponível. Tente novamente em instantes.");
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
      setError("O login está temporariamente indisponível. Tente novamente em instantes.");
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
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Glow */}
          <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
            <div className="h-[700px] w-[700px] rounded-full bg-cyan-400/10 blur-[180px]" />
          </div>

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
          >
            <div
              className="
                relative
                w-full
                max-w-6xl
                max-h-[calc(100vh-2rem)]
                overflow-y-auto
                rounded-[32px]
                border
                border-white/10
                bg-[#050505]
                shadow-2xl
              "
            >
              <div className="grid md:min-h-[680px] md:grid-cols-[1fr_1.1fr]">
                {/* LEFT */}
                <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-16">
                  <div className="mb-4 inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                    ✨ Organize seus prompts em um único lugar
                  </div>

                  <h1 id="login-modal-title" className="mb-3 text-5xl font-semibold text-white">
                    Bem-vindo ao Mind.
                  </h1>

                  <p className="mb-8 text-white/50">
                    Salve, organize e encontre seus prompts em segundos.
                  </p>

                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void handleOAuth("google")}
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-xl
                        bg-white
                        py-3.5
                        font-medium
                        text-black
                        transition-all
                        hover:scale-[1.02]
                      "
                    >
                      <FcGoogle size={22} />
                      Continuar com Google
                    </button>

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void handleOAuth("discord")}
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-xl
                        bg-[#5865F2]
                        py-3.5
                        font-medium
                        text-white
                        transition-all
                        hover:scale-[1.02]
                      "
                    >
                      <FaDiscord size={20} />
                      Continuar com Discord
                    </button>

                    <div className="flex items-center gap-4 py-3">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-sm text-white/40">
                        ou
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleEmailSignIn(event);
                      }}
                      className="space-y-3"
                    >
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Email"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.03]
                        px-4
                        py-3.5
                        text-white
                        outline-none
                        transition-all
                        focus:border-white/30
                        focus:bg-white/[0.05]
                      "
                    />

                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Senha"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.03]
                        px-4
                        py-3.5
                        text-white
                        outline-none
                        transition-all
                        focus:border-white/30
                        focus:bg-white/[0.05]
                      "
                    />

                    <div className="flex justify-end">
                      <button type="button" onClick={() => void handlePasswordReset()} disabled={pending} className="text-sm text-white/50 transition hover:text-white disabled:opacity-50">
                        Esqueceu sua senha?
                      </button>
                    </div>

                    {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}
                    {notice && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-100">{notice}</p>}

                    <button
                      type="submit"
                      disabled={pending || !email.trim() || !password}
                      className="
                        w-full
                        rounded-xl
                        bg-white
                        py-3.5
                        font-semibold
                        text-black
                        transition-all
                        hover:scale-[1.02]
                        active:scale-[0.98]
                      "
                    >
                      {pending ? "Aguarde..." : "Entrar no Mind →"}
                    </button>
                    </form>

                    <div className="pt-3 text-center text-sm text-white/50">
                      Não possui conta?{" "}
                      <button
                        type="button"
                        onClick={() =>
                          router.push("/register")
                        }
                        className="font-medium text-white transition hover:opacity-80"
                      >
                        Criar conta →
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="relative hidden md:block">
                  <Image
                    src="/modal.png"
                    alt="Mind"
                    fill
                    priority
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />

                  <div className="absolute bottom-8 left-8 max-w-sm">
                    <h2 className="text-3xl font-semibold text-white">
                      Nunca mais perca um prompt.
                    </h2>

                    <p className="mt-3 text-white/60">
                      Organize suas ideias e encontre seus prompts quando precisar.
                    </p>
                  </div>

                  <div className="absolute bottom-8 right-8">
                    <Logo />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
