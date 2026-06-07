"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Step6Page() {
  const router = useRouter();

  const [emails, setEmails] = useState<string[]>([""]);

  function addField() {
    setEmails([...emails, ""]);
  }

  function updateEmail(
    index: number,
    value: string
  ) {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">

        <div className="mb-10">
          <p className="text-sm text-white/50">
            Passo 6 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[85%] rounded-full bg-white" />
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
            Convide sua equipe
          </h1>

          <p className="mt-3 text-white/60">
            Adicione membros para colaborar nos seus prompts e workspaces.
          </p>

          <div className="mt-8 space-y-4">

            {emails.map((email, index) => (
              <input
                key={index}
                value={email}
                onChange={(e) =>
                  updateEmail(
                    index,
                    e.target.value
                  )
                }
                placeholder="email@empresa.com"
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
            ))}

            <button
              onClick={addField}
              className="
                w-full
                rounded-xl
                border
                border-dashed
                border-white/20
                py-4
                text-white/70
                transition
                hover:border-white/40
                hover:text-white
              "
            >
              + Adicionar outro membro
            </button>

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

            <div className="flex gap-3">

              <button
                onClick={() =>
                  router.push("/register/step-7")
                }
                className="
                  rounded-xl
                  border
                  border-white/10
                  px-6
                  py-3
                "
              >
                Pular
              </button>

              <button
                onClick={() =>
                  router.push("/register/step-7")
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
                Continuar →
              </button>

            </div>

          </div>

        </motion.div>

      </div>
    </main>
  );
}