"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { saveOnboardingProgress } from "@/lib/firebase/data";

const sources = [
  {
    emoji: "🔍",
    title: "Google",
  },
  {
    emoji: "🎥",
    title: "YouTube",
  },
  {
    emoji: "📱",
    title: "TikTok",
  },
  {
    emoji: "📸",
    title: "Instagram",
  },
  {
    emoji: "💬",
    title: "Discord",
  },
  {
    emoji: "👥",
    title: "Indicação",
  },
  {
    emoji: "💻",
    title: "GitHub",
  },
  {
    emoji: "✨",
    title: "Outro",
  },
];

export default function Step3Page() {
  const router = useRouter();
  const { user, ready } = useOnboardingGuard();
  const { data, updateData } = useOnboarding();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function selectSource(source: string) {
    if (!user) return;
    setPending(true);
    setError("");
    try {
      await saveOnboardingProgress(user, { source });
      updateData({ source });
      router.push("/register/step-4");
    } catch {
      setError("Não foi possível salvar sua resposta. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function skipStep() {
    if (!user) return;
    setPending(true);
    setError("");
    try {
      await saveOnboardingProgress(user, { source: "" });
      updateData({ source: "" });
      router.push("/register/step-4");
    } catch {
      setError("Não foi possível continuar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background text-muted">Carregando cadastro...</main>;
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-3xl">

        <div className="mb-10">
          <p className="text-sm text-muted">
            Passo 3 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full w-[42%] rounded-full bg-primary" />
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
            Como você conheceu o Mind?
          </h1>

          <p className="mt-3 text-muted">
            Queremos saber o que está funcionando para encontrar novos usuários.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            {sources.map((source) => (
              <button
                key={source.title}
                disabled={pending}
                onClick={() => void selectSource(source.title)}
                className={`
                  rounded-2xl
                  border
                  border-border
                  bg-foreground/[0.03]
                  p-5
                  text-left
                  transition
                  hover:border-foreground/30
                  hover:bg-foreground/[0.06]
                  hover:scale-[1.02]
                  disabled:cursor-wait
                  disabled:opacity-60
                  ${data.source === source.title ? "border-foreground/30 bg-foreground/[0.08]" : ""}
                `}
              >
                <div className="text-3xl">
                  {source.emoji}
                </div>

                <h3 className="mt-4 font-semibold">
                  {source.title}
                </h3>
              </button>
            ))}

          </div>

          <button
            disabled={pending}
            onClick={() => void skipStep()}
            className="
              mt-8
              text-sm
              text-muted
              hover:text-foreground
              transition
              disabled:opacity-50
            "
          >
            Pular esta etapa
          </button>

          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}

        </motion.div>
      </div>
    </main>
  );
}
