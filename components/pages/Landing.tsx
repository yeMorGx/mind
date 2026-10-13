"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import { Spotlight } from "@/components/ui/spotlight";
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

  const headline = "Build your personal prompt library.";

  return (
    <main>
    <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-background text-foreground">

      {/* DARK OVERLAY */}
      <motion.div
        className="fixed inset-0 bg-black/40 z-40 pointer-events-none"
        animate={{ opacity: isModalOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* LANDING CONTENT (BLUR AQUI) */}
      <motion.div
        className="flex flex-col items-center justify-center w-full"
        animate={{
          filter: isModalOpen ? "blur(8px)" : "blur(0px)",
          scale: isModalOpen ? 0.98 : 1,
        }}
        transition={{ duration: 0.25 }}
      >


        <motion.h1
          initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 1 }}
          className={`${instrumentSerif.className} text-4xl font-bold mb-8 text-center`}
        >
          {headline}
        </motion.h1>

        <p className="max-w-lg px-6 text-center text-sm text-white/55">
          Salve, organize e encontre seus melhores prompts em um só lugar.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:scale-[1.02]"
          >
            Começar grátis
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl border border-white/15 px-6 py-3 text-white/75 transition hover:bg-white/5 hover:text-white"
          >
            Já tenho uma conta
          </button>
        </div>
      </motion.div>
      <Spotlight />

      {/* MODAL */}
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
      {initialPrompts.length > 0 && (
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
      )}
    </main>
  );
}
