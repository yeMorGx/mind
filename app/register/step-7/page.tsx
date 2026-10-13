"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { createCreatorProfile } from "@/lib/supabase/data";
import type { OnboardingData } from "@/lib/supabase/types";

const icons = ["🧠", "🚀", "💻", "📚", "⚡", "🔥", "🎯", "✨"];

export default function Step7Page() {
  const { user, ready } = useOnboardingGuard();
  const { data, updateData } = useOnboarding();
  if (!ready || !user) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white/60">Carregando cadastro...</main>;
  }

  return (
    <Step7Form
      key={user.id}
      user={user}
      initialCreatorName={data.creatorName}
      initialCreatorIcon={data.creatorIcon || "🧠"}
      updateData={updateData}
    />
  );
}

function Step7Form({
  user,
  initialCreatorName,
  initialCreatorIcon,
  updateData,
}: {
  user: User;
  initialCreatorName: string;
  initialCreatorIcon: string;
  updateData: (values: Partial<OnboardingData>) => void;
}) {
  const router = useRouter();
  const [creator, setCreator] = useState(initialCreatorName);
  const [selectedIcon, setSelectedIcon] = useState(initialCreatorIcon);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { data } = useOnboarding();

  const slug = creator
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  async function finishProfile() {
    if (!user) return;
    if (!creator.trim()) {
      setError("Digite o nome público do seu perfil.");
      return;
    }

    setPending(true);
    setError("");
    const values = {
      ...data,
      creatorName: creator.trim(),
      creatorIcon: selectedIcon,
    };

    try {
      const creatorSlug = await createCreatorProfile(user, values);
      updateData({ ...values, creatorSlug, onboardingComplete: true });
      router.push("/register/finish");
    } catch (creatorError) {
      setError(creatorError instanceof Error ? creatorError.message : "Não foi possível criar seu perfil. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <p className="text-sm text-white/50">Passo 7 de 7</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-white" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold">Crie seu perfil de criador</h1>
          <p className="mt-3 text-white/60">
            Seu nome aparecerá junto aos prompts que você publicar.
          </p>

          <div className="mt-8">
            <label htmlFor="creator-name" className="mb-2 block text-sm text-white/50">
              Nome público
            </label>
            <input
              id="creator-name"
              required
              value={creator}
              onChange={(event) => setCreator(event.target.value)}
              placeholder="Ex.: Ana IA"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition focus:border-white/30"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">Nome de exibição</p>
            <p className="mt-2 font-medium">Seu perfil terá o nome “{slug || "seu-nome"}”.</p>
          </div>

          <div className="mt-8">
            <p className="mb-4 text-sm text-white/50">Escolha um ícone</p>
            <div className="grid grid-cols-4 gap-3">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  aria-label={`Usar ícone ${icon}`}
                  aria-pressed={selectedIcon === icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`h-16 rounded-xl text-3xl transition ${selectedIcon === icon ? "border border-white bg-white/10" : "border border-white/10 bg-white/[0.03]"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">Preview</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-2xl">
                {selectedIcon}
              </div>
              <div>
                <h3 className="font-medium">{creator.trim() || "Seu nome público"}</h3>
                <p className="text-sm text-white/50">Esse nome aparecerá nas páginas compartilhadas.</p>
              </div>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

          <div className="mt-8 flex justify-between">
            <button onClick={() => router.back()} className="rounded-xl border border-white/10 px-6 py-3">
              Voltar
            </button>
            <button
              disabled={pending || !creator.trim()}
              onClick={() => void finishProfile()}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Criar perfil →"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
