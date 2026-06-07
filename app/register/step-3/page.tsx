"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-3xl">

        <div className="mb-10">
          <p className="text-sm text-white/50">
            Passo 3 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[42%] rounded-full bg-white" />
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

          <p className="mt-3 text-white/60">
            Queremos saber o que está funcionando para encontrar novos usuários.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            {sources.map((source) => (
              <button
                key={source.title}
                onClick={() =>
                  router.push("/register/step-4")
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
                  {source.emoji}
                </div>

                <h3 className="mt-4 font-semibold">
                  {source.title}
                </h3>
              </button>
            ))}

          </div>

          <button
            onClick={() => router.push("/register/step-4")}
            className="
              mt-8
              text-sm
              text-white/50
              hover:text-white
              transition
            "
          >
            Pular esta etapa
          </button>

        </motion.div>
      </div>
    </main>
  );
}