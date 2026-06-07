"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  step: number;
};

export default function OnboardingLayout({
  children,
  step,
}: Props) {
  const percentage = (step / 8) * 100;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-2xl px-8">

        <div className="mb-8">
          <p className="text-sm text-white/50">
            Passo {step} de 8
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}