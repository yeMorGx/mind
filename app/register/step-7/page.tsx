"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const icons = [
  "🧠",
  "🚀",
  "💻",
  "📚",
  "⚡",
  "🔥",
  "🎯",
  "✨",
];

export default function Step7Page() {
  const router = useRouter();

  const [workspace, setWorkspace] =
    useState("");

  const [selectedIcon, setSelectedIcon] =
    useState("🧠");

  const slug = workspace
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">

        <div className="mb-10">
          <p className="text-sm text-white/50">
            Passo 7 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-white" />
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
            Crie seu Workspace
          </h1>

          <p className="mt-3 text-white/60">
            Esse será o espaço onde seus prompts e coleções ficarão organizados.
          </p>

          <div className="mt-8">

            <label className="mb-2 block text-sm text-white/50">
              Nome do Workspace
            </label>

            <input
              value={workspace}
              onChange={(e) =>
                setWorkspace(e.target.value)
              }
              placeholder="Prompt Vault"
              className="
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-4
                py-4
                outline-none
                transition
                focus:border-white/30
              "
            />

          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">
              URL do Workspace
            </p>

            <p className="mt-2 font-medium">
              mind.app/{slug || "workspace"}
            </p>
          </div>

          <div className="mt-8">
            <p className="mb-4 text-sm text-white/50">
              Escolha um ícone
            </p>

            <div className="grid grid-cols-4 gap-3">

              {icons.map((icon) => (
                <button
                  key={icon}
                  onClick={() =>
                    setSelectedIcon(icon)
                  }
                  className={`
                    h-16
                    rounded-xl
                    text-3xl
                    transition
                    ${
                      selectedIcon === icon
                        ? "border border-white bg-white/10"
                        : "border border-white/10 bg-white/[0.03]"
                    }
                  `}
                >
                  {icon}
                </button>
              ))}

            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">
              Preview
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-2xl">
                {selectedIcon}
              </div>

              <div>
                <h3 className="font-medium">
                  {workspace || "Meu Workspace"}
                </h3>

                <p className="text-sm text-white/50">
                  mind.app/{slug || "workspace"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">

            <button
              onClick={() => router.back()}
              className="
                rounded-xl
                border
                border-white/10
                px-6
                py-3
              "
            >
              Voltar
            </button>

            <button
              onClick={() =>
                router.push("/register/finish")
              }
              className="
                rounded-xl
                bg-white
                px-6
                py-3
                font-semibold
                text-black
              "
            >
              Criar Workspace →
            </button>

          </div>

        </motion.div>

      </div>
    </main>
  );
}