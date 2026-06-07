"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Step5Page() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">

        <div className="mb-10">
          <p className="text-sm text-white/50">
            Passo 5 de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[71%] rounded-full bg-white" />
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
            Crie sua equipe
          </h1>

          <p className="mt-3 text-white/60">
            Convide pessoas depois ou configure tudo agora.
          </p>

          <div className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block text-sm text-white/50">
                Nome da equipe
              </label>

              <input
                placeholder="Ex: Mind Developers"
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

            <div>
              <label className="mb-2 block text-sm text-white/50">
                Quantidade de membros
              </label>

              <select
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-4
                  py-4
                  outline-none
                "
              >
                <option>2-5 pessoas</option>
                <option>6-10 pessoas</option>
                <option>11-25 pessoas</option>
                <option>26-50 pessoas</option>
                <option>50+ pessoas</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-medium">
                Preview
              </p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl">
                  👥
                </div>

                <div>
                  <h3 className="font-medium">
                    Mind Developers
                  </h3>

                  <p className="text-sm text-white/50">
                    Workspace colaborativo
                  </p>
                </div>
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
                router.push("/register/step-6")
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

        </motion.div>

      </div>
    </main>
  );
}