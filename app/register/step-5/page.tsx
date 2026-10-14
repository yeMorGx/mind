"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { MindUser as User } from "@/lib/backend";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { saveOnboardingProgress } from "@/lib/firebase/data";

export default function Step5Page() {
  const { user, ready } = useOnboardingGuard();
  const { data } = useOnboarding();

  if (!ready || !user) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white/60">Carregando cadastro...</main>;
  }

  return (
    <Step5Form
      key={user.uid}
      user={user}
      initialTeamName={data.teamName}
      initialTeamSize={data.teamSize || "2-5 pessoas"}
    />
  );
}

function Step5Form({
  user,
  initialTeamName,
  initialTeamSize,
}: {
  user: User;
  initialTeamName: string;
  initialTeamSize: string;
}) {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [teamName, setTeamName] = useState(initialTeamName);
  const [teamSize, setTeamSize] = useState(initialTeamSize);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function continueToInvites() {
    if (!user) return;
    if (!teamName.trim()) {
      setError("Digite um nome para sua equipe.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const values = { teamName: teamName.trim(), teamSize };
      await saveOnboardingProgress(user, values);
      updateData(values);
      router.push("/register/step-6");
    } catch {
      setError("Não foi possível salvar sua equipe. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <p className="text-sm text-white/50">Passo 5 de 7</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[71%] rounded-full bg-white" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold">Crie sua equipe</h1>
          <p className="mt-3 text-white/60">
            Configure o espaço da equipe. O acesso de outros membros será liberado quando o fluxo de convites estiver ativo.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="team-name" className="mb-2 block text-sm text-white/50">
                Nome da equipe
              </label>
              <input
                id="team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Ex: Mind Developers"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition focus:border-white/30"
              />
            </div>

            <div>
              <label htmlFor="team-size" className="mb-2 block text-sm text-white/50">
                Quantidade de membros
              </label>
              <select
                id="team-size"
                value={teamSize}
                onChange={(event) => setTeamSize(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-4 outline-none"
              >
                <option>2-5 pessoas</option>
                <option>6-10 pessoas</option>
                <option>11-25 pessoas</option>
                <option>26-50 pessoas</option>
                <option>50+ pessoas</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-medium">Preview</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl">👥</div>
                <div>
                  <h3 className="font-medium">{teamName || "Nome da equipe"}</h3>
                  <p className="text-sm text-white/50">Workspace colaborativo · {teamSize}</p>
                </div>
              </div>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

          <div className="mt-8 flex justify-between">
            <button onClick={() => router.back()} className="rounded-xl border border-white/10 px-6 py-3">
              Voltar
            </button>
            <button
              disabled={pending}
              onClick={() => void continueToInvites()}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Continuar →"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
