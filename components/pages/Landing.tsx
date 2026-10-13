"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUpRight, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import Logo from "@/components/ui/logo";
import LoginModal from "@/components/modal/modalLogin";
import PromptCard from "@/components/marketplace/PromptCard";
import { useOnboarding } from "@/app/context/OnboardingContext";
import type { Prompt } from "@/lib/supabase/types";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" });

export default function Landing({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const router = useRouter();
  const { user, authReady, profileLoading, data } = useOnboarding();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tudo");

  useEffect(() => {
    if (!authReady || !user || profileLoading) return;
    if (data.onboardingComplete) router.replace("/home");
    else if (!data.role) router.replace("/register/step-2");
    else if (!data.usageType) router.replace("/register/step-4");
    else if (data.usageType === "team" && !data.teamName) router.replace("/register/step-5");
    else router.replace("/register/step-7");
  }, [authReady, data, profileLoading, router, user]);

  const categories = useMemo(() => ["Tudo", ...new Set(initialPrompts.map((prompt) => prompt.category).filter(Boolean))], [initialPrompts]);
  const visiblePrompts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return initialPrompts.filter((prompt) => {
      const inCategory = category === "Tudo" || prompt.category === category;
      const hasSearch = !term || `${prompt.title} ${prompt.description} ${prompt.content} ${prompt.creatorName}`.toLocaleLowerCase().includes(term);
      return inCategory && hasSearch;
    });
  }, [category, initialPrompts, search]);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-3">
          <a href="#explorar" className="hidden px-3 py-2 text-sm text-white/55 transition hover:text-white sm:block">Explorar</a>
          <button type="button" onClick={() => setIsModalOpen(true)} className="rounded-xl px-3 py-2 text-sm text-white/65 transition hover:text-white">Entrar</button>
          <button type="button" onClick={() => router.push("/register")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">Publicar prompt</button>
        </nav>
      </header>

      <section className="relative mx-auto flex min-h-[590px] w-full max-w-7xl flex-col justify-center px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-0 h-[500px] w-[500px] rounded-full bg-violet-400/[0.08] blur-[130px]" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative max-w-4xl">
          <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60">
            <Sparkles size={14} className="text-violet-200" /> A comunidade de prompts para criadores de IA
          </p>
          <h1 className={`${instrumentSerif.className} max-w-4xl text-6xl leading-[.98] tracking-tight sm:text-8xl`}>
            Veja a imagem.<br />
            <span className="text-white/48">Copie o prompt.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            Descubra prompts compartilhados por criadores, veja os resultados e leve a ideia para suas próprias imagens e vídeos.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#explorar" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-semibold text-black transition hover:bg-white/90">
              Explorar prompts <ArrowDown size={17} />
            </a>
            <button type="button" onClick={() => router.push("/register")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 font-medium text-white/80 transition hover:bg-white/5 hover:text-white">
              Criar meu perfil <ArrowUpRight size={17} />
            </button>
          </div>
        </motion.div>
        <div className="relative mt-16 grid max-w-3xl gap-4 border-t border-white/10 pt-5 text-sm text-white/40 sm:grid-cols-3">
          <p>Prompts grátis para experimentar</p>
          <p>Exemplos visuais em cada publicação</p>
          <p>Links prontos para enviar aos seguidores</p>
        </div>
      </section>

      <section id="explorar" className="scroll-mt-6 border-t border-white/[0.07] bg-[#080808] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Inspiração aberta</p>
              <h2 className={`${instrumentSerif.className} mt-3 text-5xl sm:text-6xl`}>Prompts da comunidade</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Cada publicação reúne o prompt e as imagens que mostram o resultado. Abra uma para copiar e compartilhar.</p>
            </div>
            <label className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 md:max-w-sm">
              <Search size={17} className="shrink-0 text-white/35" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar prompts ou criadores" className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-white/35" />
            </label>
          </div>

          {categories.length > 1 && <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${category === item ? "border-white bg-white text-black" : "border-white/10 text-white/55 hover:border-white/25 hover:text-white"}`}>{item}</button>)}
          </div>}

          {visiblePrompts.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
              <p className="text-lg font-medium">{initialPrompts.length ? "Nenhum prompt encontrado" : "As primeiras publicações estão chegando"}</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/45">{initialPrompts.length ? "Tente outra busca ou categoria." : "Crie seu perfil, monte um carrossel com seus resultados e compartilhe o prompt com a comunidade."}</p>
              {!initialPrompts.length && <button type="button" onClick={() => router.push("/register")} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Publicar o primeiro prompt</button>}
            </div>
          )}
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-6 text-xs text-white/35 sm:flex-row sm:px-8">
        <span>Mind · prompts para quem cria com IA</span>
        <span>Grátis para descobrir e compartilhar</span>
      </footer>

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
