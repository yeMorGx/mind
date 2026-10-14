"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import { CloudShader } from "@/components/ui/cloud-shader";
import LandingGallery from "@/components/pages/LandingGallery";
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
    if (data.onboardingComplete) return;
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
    <div className="relative overflow-hidden min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <CloudShader className="h-full w-full" speed={0.4} skyTopColor="#6ca8da" skyBottomColor="#b9ddf3" />
      </div>

      {/* DARK OVERLAY */}
      <motion.div
        className="fixed inset-0 bg-black/40 z-40 pointer-events-none"
        animate={{ opacity: isModalOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* LANDING CONTENT (BLUR AQUI) */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full pt-16 sm:pt-20"
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
          className={`${instrumentSerif.className} text-4xl font-bold mb-8 text-center text-foreground`}
        >
          {headline}
        </motion.h1>

        <p className="max-w-lg px-6 text-center text-sm text-foreground">
          Salve, organize e encontre seus melhores prompts em um só lugar.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(user && data.onboardingComplete ? "/home" : "/register")}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {user && data.onboardingComplete ? "Minha biblioteca" : "Começar grátis"}
          </button>
          <button
            type="button"
            onClick={() => user && data.onboardingComplete ? router.push(`/u/${user.uid}`) : setIsModalOpen(true)}
            className="rounded-xl border border-border bg-surface px-6 py-3 text-foreground transition hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {user && data.onboardingComplete ? "Meu perfil" : "Já tenho uma conta"}
          </button>
        </div>
        <LandingGallery prompts={initialPrompts} suspended={isModalOpen} />
      </motion.div>

      {/* MODAL */}
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
      {initialPrompts.length > 0 && (
      <section id="explorar" className="scroll-mt-24 border-t border-border bg-surface px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-subtle">Inspiração aberta</p>
              <h2 className={`${instrumentSerif.className} mt-3 text-5xl sm:text-6xl`}>Prompts da comunidade</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-subtle">Cada publicação reúne o prompt e as imagens que mostram o resultado. Abra uma para copiar e compartilhar.</p>
            </div>
            <label className="flex w-full items-center gap-3 rounded-xl border border-border bg-foreground/[0.03] px-4 md:max-w-sm">
              <Search size={17} className="shrink-0 text-subtle" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar prompts ou criadores" className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-subtle" />
            </label>
          </div>

          {categories.length > 1 && <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${category === item ? "border-foreground bg-primary text-primary-foreground" : "border-border text-muted hover:border-foreground/30 hover:text-foreground"}`}>{item}</button>)}
          </div>}

          {visiblePrompts.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <p className="text-lg font-medium">{initialPrompts.length ? "Nenhum prompt encontrado" : "As primeiras publicações estão chegando"}</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-subtle">{initialPrompts.length ? "Tente outra busca ou categoria." : "Crie seu perfil, monte um carrossel com seus resultados e compartilhe o prompt com a comunidade."}</p>
              {!initialPrompts.length && <button type="button" onClick={() => router.push(user && data.onboardingComplete ? "/home" : "/register")} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Publicar o primeiro prompt</button>}
            </div>
          )}
        </div>
      </section>
      )}
    </main>
  );
}
