import Link from "next/link";

export default function PromptNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-sm text-white/40">Mind · Prompts da comunidade</p>
        <h1 className="mt-4 text-3xl font-semibold">Este prompt não está disponível</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">O link pode estar incorreto ou o prompt pode ter sido removido ou voltado a ser um rascunho.</p>
        <Link href="/" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Explorar outros prompts</Link>
      </div>
    </main>
  );
}
