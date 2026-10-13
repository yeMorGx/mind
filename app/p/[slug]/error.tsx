"use client";

import Link from "next/link";

export default function PromptError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Não conseguimos carregar este prompt</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">Ocorreu um problema ao buscar a publicação. Tente novamente em alguns instantes.</p>
        <button type="button" onClick={reset} className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Tentar novamente</button>
        <Link href="/" className="mt-5 block text-sm text-white/55 hover:text-white">Voltar para os prompts</Link>
      </div>
    </main>
  );
}
