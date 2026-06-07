"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Step4Page() {
  const router = useRouter();

  function handleSelect(type: "individual" | "team") {
    if (type === "team") {
      router.push("/register/step-5");
      return;
    }

    router.push("/register/step-7");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-3xl">

        <div className="mb-10">
          <p className="text-sm text-white/50">
            Passo 4 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[57%] rounded-full bg-white" />
          </div>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <h1 className="text-4xl font-bold">
            Como você pretende usar o Mind?
          </h1>

          <p className="mt-3 text-white/60">
            Isso ajuda a configurar seu workspace.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            <button
              onClick={() => handleSelect("individual")}
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.03]
                p-6
                text-left
                transition
                hover:border-white/30
                hover:bg-white/[0.06]
                hover:scale-[1.02]
              "
            >
              <div className="text-4xl">
                👤
              </div>

              <h3 className="mt-4 text-xl font-semibold">
                Apenas eu
              </h3>

              <p className="mt-2 text-sm text-white/50">
                Organize seus prompts de forma pessoal.
              </p>
            </button>

            <button
              onClick={() => handleSelect("team")}
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.03]
                p-6
                text-left
                transition
                hover:border-white/30
                hover:bg-white/[0.06]
                hover:scale-[1.02]
              "
            >
              <div className="text-4xl">
                👥
              </div>

              <h3 className="mt-4 text-xl font-semibold">
                Minha equipe
              </h3>

              <p className="mt-2 text-sm text-white/50">
                Compartilhe prompts e colabore com outras pessoas.
              </p>
            </button>

          </div>
        </motion.div>

      </div>
    </main>
  );
}