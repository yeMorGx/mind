"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { saveOnboardingProgress } from "@/lib/firebase/data";

const roles = [
  {
    emoji: "💻",
    title: "Desenvolvedor",
    description: "Crio aplicações e sistemas",
  },
  {
    emoji: "🎨",
    title: "Designer",
    description: "Design, UI e experiência",
  },
  {
    emoji: "📈",
    title: "Marketing",
    description: "Campanhas e crescimento",
  },
  {
    emoji: "🎓",
    title: "Estudante",
    description: "Aprendizado e estudos",
  },
  {
    emoji: "🏢",
    title: "Empresário",
    description: "Negócios e gestão",
  },
  {
    emoji: "✨",
    title: "Outro",
    description: "Outra atividade",
  },
];

export default function Step2Page() {
  const router = useRouter();
  const { user, ready } = useOnboardingGuard();
  const { data, updateData } = useOnboarding();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function selectRole(role: string) {
    if (!user) return;
    setPending(true);
    setError("");
    try {
      await saveOnboardingProgress(user, { role });
      updateData({ role });
      router.push("/register/step-3");
    } catch {
      setError("Não foi possível salvar sua resposta. Tente novamente.");
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

        {/* progresso */}
        <div className="mb-10">
          <p className="text-sm text-muted">
            Passo 2 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full w-[28%] rounded-full bg-primary" />
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
            O que você faz?
          </h1>

          <p className="mt-3 text-muted">
            Isso nos ajuda a personalizar sua experiência.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            {roles.map((role) => (
              <button
                key={role.title}
                disabled={pending}
                onClick={() => void selectRole(role.title)}
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
                  ${data.role === role.title ? "border-foreground/30 bg-foreground/[0.08]" : ""}
                `}
              >
                <div className="text-3xl">
                  {role.emoji}
                </div>

                <h3 className="mt-4 font-semibold">
                  {role.title}
                </h3>

                <p className="mt-1 text-sm text-muted">
                  {role.description}
                </p>
              </button>
            ))}

          </div>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </motion.div>
      </div>
    </main>
  );
}
