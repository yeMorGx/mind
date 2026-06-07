"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useOnboarding } from "@/app/context/OnboardingContext";

export default function FinishPage() {
  const router = useRouter();
  const { data } = useOnboarding();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/[0.03]
            p-10
            backdrop-blur-xl
          "
        >
          <div className="text-center">

            <div className="mb-6 text-7xl">
              🎉
            </div>

            <h1 className="text-5xl font-bold">
              Tudo pronto!
            </h1>

            <p className="mt-4 text-white/60">
              Seu workspace foi configurado com sucesso.
            </p>

          </div>

          <div className="mt-10 space-y-4">

            <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
              <span className="text-white/60">
                Nome
              </span>

              <span>
                {data.name}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
              <span className="text-white/60">
                Profissão
              </span>

              <span>
                {data.role}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
              <span className="text-white/60">
                Workspace
              </span>

              <span>
                {data.workspaceIcon}{" "}
                {data.workspaceName}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
              <span className="text-white/60">
                Tipo
              </span>

              <span>
                {data.usageType === "team"
                  ? "Equipe"
                  : "Individual"}
              </span>
            </div>

          </div>

          <div className="mt-10 rounded-2xl bg-white/5 p-5">
            <h3 className="font-medium">
              O que acontece agora?
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>✓ Seu workspace foi criado</li>
              <li>✓ Sua conta está pronta</li>
              <li>✓ Você pode começar a salvar prompts</li>
              <li>✓ Coleções serão criadas automaticamente</li>
            </ul>
          </div>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="
              mt-8
              w-full
              rounded-xl
              bg-white
              py-4
              font-semibold
              text-black
              transition
              hover:scale-[1.02]
            "
          >
            Entrar no Dashboard →
          </button>

        </motion.div>

      </div>
    </main>
  );
}