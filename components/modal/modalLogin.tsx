"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";

import Logo from "@/components/ui/logo";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();

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
                overflow-hidden
                rounded-[32px]
                border
                border-white/10
                bg-[#050505]
                shadow-2xl
              "
            >
              <div className="grid min-h-[680px] md:grid-cols-[1fr_1.1fr]">
                {/* LEFT */}
                <div className="flex flex-col justify-center p-12 lg:p-16">
                  <div className="mb-4 inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                    ✨ Organize seus prompts em um único lugar
                  </div>

                  <h1 className="mb-3 text-5xl font-semibold text-white">
                    Bem-vindo ao Mind.
                  </h1>

                  <p className="mb-8 text-white/50">
                    Salve, organize e encontre seus prompts em segundos.
                  </p>

                  <div className="space-y-3">
                    <button
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

                    <input
                      type="email"
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
                      type="password"
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
                      <button className="text-sm text-white/50 transition hover:text-white">
                        Esqueceu sua senha?
                      </button>
                    </div>

                    <button
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
                      Entrar no Mind →
                    </button>

                    <div className="pt-3 text-center text-sm text-white/50">
                      Não possui conta?{" "}
                      <button
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
                      Crie coleções, organize ideias e mantenha tudo sincronizado.
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