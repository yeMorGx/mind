"use client";

import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <OnboardingLayout step={1}>
      <h1 className="text-4xl font-bold">
        Crie sua conta
      </h1>

      <p className="mt-2 text-white/60">
        Vamos começar com algumas informações.
      </p>

      <div className="mt-8 space-y-4">
        <input
          placeholder="Nome"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-4"
        />

        <input
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-4"
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-4"
        />
      </div>

      <button
        onClick={() =>
          router.push("/register/step-2")
        }
        className="mt-8 w-full rounded-xl bg-white py-4 text-black"
      >
        Continuar
      </button>
    </OnboardingLayout>
  );
}