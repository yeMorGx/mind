"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { saveOnboardingProgress } from "@/lib/firebase/data";

export default function Step4Page() {
  const router = useRouter();
  const { user, ready } = useOnboardingGuard();
  const { data, updateData } = useOnboarding();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSelect(type: "individual" | "team") {
    if (!user) return;
    setPending(true);
    setError("");
    try {
      await saveOnboardingProgress(user, { usageType: type });
      updateData({ usageType: type });
      router.push(type === "team" ? "/register/step-5" : "/register/step-7");
    } catch {
      setError("Não foi possível salvar sua resposta. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white/60">Carregando cadastro...</main>;
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
              disabled={pending}
              onClick={() => void handleSelect("individual")}
              className={`
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
                disabled:cursor-wait
                disabled:opacity-60
                ${data.usageType === "individual" ? "border-white/40 bg-white/[0.08]" : ""}
              `}
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
              disabled={pending}
              onClick={() => void handleSelect("team")}
              className={`
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
                disabled:cursor-wait
                disabled:opacity-60
                ${data.usageType === "team" ? "border-white/40 bg-white/[0.08]" : ""}
              `}
            >
              <div className="text-4xl">
                👥
              </div>

              <h3 className="mt-4 text-xl font-semibold">
                Minha equipe
              </h3>

              <p className="mt-2 text-sm text-white/50">
                Configure um workspace para sua equipe e prepare os convites.
              </p>
            </button>

          </div>
          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        </motion.div>

      </div>
    </main>
  );
}
