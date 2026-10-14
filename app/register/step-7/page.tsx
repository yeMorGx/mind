"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { MindUser as User } from "@/lib/backend";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { createWorkspaceForUser, type OnboardingData } from "@/lib/firebase/data";

const icons = ["🧠", "🚀", "💻", "📚", "⚡", "🔥", "🎯", "✨"];

export default function Step7Page() {
  const { user, ready } = useOnboardingGuard();
  const { data, updateData } = useOnboarding();
  if (!ready || !user) {
    return <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background text-muted">Carregando cadastro...</main>;
  }

  return (
    <Step7Form
      key={user.uid}
      user={user}
      initialWorkspaceName={data.workspaceName}
      initialWorkspaceIcon={data.workspaceIcon || "🧠"}
      updateData={updateData}
    />
  );
}

function Step7Form({
  user,
  initialWorkspaceName,
  initialWorkspaceIcon,
  updateData,
}: {
  user: User;
  initialWorkspaceName: string;
  initialWorkspaceIcon: string;
  updateData: (values: Partial<OnboardingData>) => void;
}) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState(initialWorkspaceName);
  const [selectedIcon, setSelectedIcon] = useState(initialWorkspaceIcon);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { data } = useOnboarding();

  const slug = workspace
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  async function finishWorkspace() {
    if (!user) return;
    if (!workspace.trim()) {
      setError("Digite um nome para o workspace.");
      return;
    }

    setPending(true);
    setError("");
    const values = {
      ...data,
      workspaceName: workspace.trim(),
      workspaceIcon: selectedIcon,
    };

    try {
      const workspaceId = await createWorkspaceForUser(user, values);
      updateData({ ...values, primaryWorkspaceId: workspaceId, onboardingComplete: true });
      router.push("/register/finish");
    } catch (workspaceError) {
      setError(workspaceError instanceof Error ? workspaceError.message : "Não foi possível criar seu workspace. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <p className="text-sm text-muted">Passo 7 de 7</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold">Crie seu Workspace</h1>
          <p className="mt-3 text-muted">
            Esse será o espaço onde seus prompts e coleções ficarão organizados.
          </p>

          <div className="mt-8">
            <label htmlFor="workspace-name" className="mb-2 block text-sm text-muted">
              Nome do Workspace
            </label>
            <input
              id="workspace-name"
              required
              value={workspace}
              onChange={(event) => setWorkspace(event.target.value)}
              placeholder="Prompt Vault"
              className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-4 outline-none transition focus:border-foreground/30"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-foreground/[0.03] p-5">
            <p className="text-sm text-muted">Endereço sugerido</p>
            <p className="mt-2 font-medium">mind.app/{slug || "workspace"}</p>
          </div>

          <div className="mt-8">
            <p className="mb-4 text-sm text-muted">Escolha um ícone</p>
            <div className="grid grid-cols-4 gap-3">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  aria-label={`Usar ícone ${icon}`}
                  aria-pressed={selectedIcon === icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`h-16 rounded-xl text-3xl transition ${selectedIcon === icon ? "border border-foreground bg-foreground/10" : "border border-border bg-foreground/[0.03]"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-foreground/[0.03] p-5">
            <p className="text-sm text-muted">Preview</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground/10 text-2xl">
                {selectedIcon}
              </div>
              <div>
                <h3 className="font-medium">{workspace.trim() || "Meu Workspace"}</h3>
                <p className="text-sm text-muted">mind.app/{slug || "workspace"}</p>
              </div>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}

          <div className="mt-8 flex justify-between">
            <button onClick={() => router.back()} className="rounded-xl border border-border px-6 py-3">
              Voltar
            </button>
            <button
              disabled={pending || !workspace.trim()}
              onClick={() => void finishWorkspace()}
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Criando..." : "Criar Workspace →"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
