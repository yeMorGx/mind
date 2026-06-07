"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-3xl">

        {/* progresso */}
        <div className="mb-10">
          <p className="text-sm text-white/50">
            Passo 2 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[28%] rounded-full bg-white" />
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

          <p className="mt-3 text-white/60">
            Isso nos ajuda a personalizar sua experiência.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            {roles.map((role) => (
              <button
                key={role.title}
                onClick={() =>
                  router.push("/register/step-3")
                }
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-5
                  text-left
                  transition
                  hover:border-white/30
                  hover:bg-white/[0.06]
                  hover:scale-[1.02]
                "
              >
                <div className="text-3xl">
                  {role.emoji}
                </div>

                <h3 className="mt-4 font-semibold">
                  {role.title}
                </h3>

                <p className="mt-1 text-sm text-white/50">
                  {role.description}
                </p>
              </button>
            ))}

          </div>
        </motion.div>
      </div>
    </main>
  );
}