"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { User } from "firebase/auth";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { saveOnboardingProgress } from "@/lib/firebase/data";

export default function Step6Page() {
  const { user, ready } = useOnboardingGuard();
  const { data } = useOnboarding();

  if (!ready || !user) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white/60">Carregando cadastro...</main>;
  }

  return (
    <Step6Form
      key={user.uid}
      user={user}
      initialEmails={data.invitedEmails}
    />
  );
}

function Step6Form({ user, initialEmails }: { user: User; initialEmails: string[] }) {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [emails, setEmails] = useState<string[]>(
    initialEmails.length > 0 ? [...initialEmails] : [""],
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function updateEmail(index: number, value: string) {
    setEmails((current) => current.map((email, itemIndex) => itemIndex === index ? value : email));
  }

  async function continueToWorkspace(values = emails) {
    if (!user) return;
    const normalizedEmails = [...new Set(values.map((email) => email.trim().toLowerCase()).filter(Boolean))];
    const invalidEmail = normalizedEmails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalidEmail) {
      setError(`Confira o endereço ${invalidEmail}.`);
      return;
    }

    setPending(true);
    setError("");
    try {
      await saveOnboardingProgress(user, { invitedEmails: normalizedEmails });
      updateData({ invitedEmails: normalizedEmails });
      router.push("/register/step-7");
    } catch {
      setError("Não foi possível salvar os e-mails. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <p className="text-sm text-white/50">Passo 6 de 7</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[85%] rounded-full bg-white" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold">Prepare os convites</h1>
          <p className="mt-3 text-white/60">
            Salve os e-mails de quem deverá colaborar no workspace.
          </p>

          <div className="mt-8 space-y-4">
            {emails.map((email, index) => (
              <div key={index}>
                <label className="mb-2 block text-sm text-white/50" htmlFor={`invite-${index}`}>
                  E-mail do membro {index + 1}
                </label>
                <input
                  id={`invite-${index}`}
                  type="email"
                  value={email}
                  onChange={(event) => updateEmail(index, event.target.value)}
                  placeholder="email@empresa.com"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition focus:border-white/30"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setEmails((current) => [...current, ""])}
              className="w-full rounded-xl border border-dashed border-white/20 py-4 text-white/70 transition hover:border-white/40 hover:text-white"
            >
              + Adicionar outro e-mail
            </button>
          </div>

          <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
            Os e-mails serão guardados como convites pendentes. O envio automático precisa de um serviço de e-mail, que ainda não está configurado.
          </p>

          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

          <div className="mt-8 flex justify-between">
            <button onClick={() => router.back()} className="rounded-xl border border-white/10 px-6 py-3">
              Voltar
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => { setEmails([]); void continueToWorkspace([]); }}
                className="rounded-xl border border-white/10 px-6 py-3 disabled:opacity-50"
              >
                Pular
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void continueToWorkspace()}
                className="rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-50"
              >
                {pending ? "Salvando..." : "Continuar →"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
