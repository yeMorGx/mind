"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import {
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";

import Logo from "@/components/ui/logo";
import { getFirebaseServices } from "@/lib/firebase/client";
import { ensureUserProfile, getAuthDestination, getFirebaseAuthMessage } from "@/lib/firebase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getNativePublicCreator, startAccountMigration } from "@/lib/supabase/mind";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function finishSignIn(action: () => Promise<UserCredential>) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const credential = await action();
      const migrated = isSupabaseConfigured ? await getNativePublicCreator(credential.user.uid) : null;
      if (migrated?.backend === "supabase") {
        await startAccountMigration(credential.user);
        return;
      }
      await ensureUserProfile(credential.user);
      const destination = await getAuthDestination(credential.user);
      onClose();
      router.push(destination);
    } catch (signInError) {
      setError(getFirebaseAuthMessage(signInError));
    } finally {
      setPending(false);
    }
  }

  function handleEmailSignIn() {
    return finishSignIn(() => {
      const services = getFirebaseServices();
      if (!services) throw new Error("Configure o Firebase no arquivo .env.local.");
      return signInWithEmailAndPassword(services.auth, email.trim(), password);
    });
  }

  function handleGoogleSignIn() {
    return finishSignIn(() => {
      const services = getFirebaseServices();
      if (!services) throw new Error("Configure o Firebase no arquivo .env.local.");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      return signInWithPopup(services.auth, provider);
    });
  }

  function handleDiscordSignIn() {
    return finishSignIn(() => {
      const services = getFirebaseServices();
      if (!services) throw new Error("Configure o Firebase no arquivo .env.local.");
      return signInWithPopup(services.auth, new OAuthProvider("oidc.discord"));
    });
  }

  async function handlePasswordReset() {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Digite seu e-mail para receber o link de redefinição.");
      return;
    }

    const services = getFirebaseServices();
    if (!services) {
      setError("Configure o Firebase no arquivo .env.local.");
      return;
    }

    setPending(true);
    try {
      await sendPasswordResetEmail(services.auth, email.trim());
      setNotice("Se houver uma conta com esse e-mail, enviaremos um link para redefinir a senha.");
    } catch (resetError) {
      const code =
        typeof resetError === "object" && resetError !== null && "code" in resetError
          ? String(resetError.code)
          : "";
      if (code === "auth/user-not-found") {
        setNotice("Se houver uma conta com esse e-mail, enviaremos um link para redefinir a senha.");
      } else {
        setError(getFirebaseAuthMessage(resetError));
      }
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
                max-w-4xl
                max-h-[calc(100vh-2rem)]
                overflow-y-auto
                rounded-[32px]
                border
                border-border
                bg-surface
                shadow-2xl
              "
            >
              <div className="grid md:min-h-[560px] md:grid-cols-[1fr_1.1fr]">
                {/* LEFT */}
                <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
                  <div className="mb-3 inline-flex w-fit rounded-full border border-border bg-foreground/[0.03] px-3 py-1 text-xs text-muted">
                    ✨ Organize seus prompts em um único lugar
                  </div>

                  <h1 id="login-modal-title" className="mb-2 text-3xl sm:text-4xl font-semibold text-foreground">
                    Bem-vindo ao Mind.
                  </h1>

                  <p className="mb-5 text-sm text-muted">
                    Salve, organize e encontre seus prompts em segundos.
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void handleGoogleSignIn()}
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-xl
                        bg-primary
                        py-2.5
                        font-medium
                        text-primary-foreground
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
                      onClick={() => void handleDiscordSignIn()}
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-xl
                        bg-[#5865F2]
                        py-2.5
                        font-medium
                        text-white
                        transition-all
                        hover:scale-[1.02]
                      "
                    >
                      <FaDiscord size={20} />
                      Continuar com Discord
                    </button>

                    <div className="flex items-center gap-4 py-2">
                      <div className="h-px flex-1 bg-foreground/10" />
                      <span className="text-sm text-subtle">
                        ou
                      </span>
                      <div className="h-px flex-1 bg-foreground/10" />
                    </div>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleEmailSignIn();
                      }}
                      className="space-y-2"
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
                        border-border
                        bg-foreground/[0.03]
                        px-4
                        py-2.5
                        text-foreground
                        outline-none
                        transition-all
                        focus:border-foreground/30
                        focus:bg-foreground/[0.05]
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
                        border-border
                        bg-foreground/[0.03]
                        px-4
                        py-2.5
                        text-foreground
                        outline-none
                        transition-all
                        focus:border-foreground/30
                        focus:bg-foreground/[0.05]
                      "
                    />

                    <div className="flex justify-end">
                      <button type="button" onClick={() => void handlePasswordReset()} disabled={pending} className="text-sm text-muted transition hover:text-foreground disabled:opacity-50">
                        Esqueceu sua senha?
                      </button>
                    </div>

                    {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-700">{error}</p>}
                    {notice && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-100">{notice}</p>}

                    <button
                      type="submit"
                      disabled={pending || !email.trim() || !password}
                      className="
                        w-full
                        rounded-xl
                        bg-primary
                        py-2.5
                        font-semibold
                        text-primary-foreground
                        transition-all
                        hover:scale-[1.02]
                        active:scale-[0.98]
                      "
                    >
                      {pending ? "Aguarde..." : "Entrar no Mind →"}
                    </button>
                    </form>

                    <div className="pt-3 text-center text-sm text-muted">
                      Não possui conta?{" "}
                      <button
                        type="button"
                        onClick={() =>
                          router.push("/register")
                        }
                        className="font-medium text-foreground transition hover:opacity-80"
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

                  <div className="absolute bottom-6 left-6 max-w-sm">
                    <h2 className="text-2xl font-semibold text-foreground">
                      Nunca mais perca um prompt.
                    </h2>

                    <p className="mt-3 text-muted">
                      Organize suas ideias e encontre seus prompts quando precisar.
                    </p>
                  </div>

                  <div className="absolute bottom-6 right-6">
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
