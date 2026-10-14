"use client";

import Link from "next/link";

export default function PromptError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Não conseguimos carregar este prompt</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Ocorreu um problema ao buscar a publicação. Tente novamente em alguns instantes.</p>
        <button type="button" onClick={reset} className="mt-7 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Tentar novamente</button>
        <Link href="/" className="mt-5 block text-sm text-muted hover:text-foreground">Voltar para os prompts</Link>
      </div>
    </main>
  );
}
