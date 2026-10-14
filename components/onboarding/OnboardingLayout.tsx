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
  const percentage = (step / 7) * 100;

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-2xl px-8">

        <div className="mb-8">
          <p className="text-sm text-muted">
            Passo {step} de 7
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full bg-primary transition-all"
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
