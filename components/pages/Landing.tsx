"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import { CloudShader } from "@/components/ui/cloud-shader";
import LandingGallery from "@/components/pages/LandingGallery";
import LoginModal from "@/components/modal/modalLogin";
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
    <main className="landing-page">
    <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
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
          className={`${instrumentSerif.className} text-4xl font-bold mb-8 text-center text-[#102a43]`}
        >
          {headline}
        </motion.h1>

        <p className="max-w-lg px-6 text-center text-sm text-[#102a43]">
          Salve, organize e encontre seus melhores prompts em um só lugar.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="rounded-xl bg-[#102a43] px-6 py-3 font-semibold text-white transition hover:bg-[#183d5d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102a43]"
          >
            Começar grátis
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl border border-white/80 bg-white/80 px-6 py-3 text-[#102a43] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102a43]"
          >
            Já tenho uma conta
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
      <section id="explorar" className="landing-community">
        <div className="landing-community-inner">
          <div className="landing-community-heading">
            <div><h2 className={instrumentSerif.className}>Prompts da comunidade</h2><p>Descubra o prompt por trás de cada resultado, direto de quem criou.</p></div>
            <Link href="/explore" className="community-explore">Explorar todos <ArrowUpRight size={18}/></Link>
          </div>
          <div className="community-toolbar">
            <div className="community-categories" aria-label="Categorias de prompts">{categories.map(item=><button key={item} type="button" aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>
            <label className="community-search"><Search size={18}/><span className="sr-only">Buscar prompts ou criadores</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar na comunidade"/></label>
          </div>
          {visiblePrompts.length ? <div className="community-grid">{visiblePrompts.map(prompt=><CommunityCard key={`${prompt.creatorId}:${prompt.id}`} prompt={prompt}/>)}</div> : <div className="community-empty" role="status"><h3>Nenhum prompt encontrado</h3><p>Tente outro termo ou escolha outra categoria.</p><button type="button" onClick={()=>{setSearch("");setCategory("Tudo");}}>Limpar busca</button></div>}
        </div>
      </section>
      )}
    </main>
  );
}

function CommunityCard({prompt}:{prompt:Prompt}){
  const [failed,setFailed]=useState(false);
  const cover=prompt.images.find(image=>image.role==="gallery"||image.role==="after")??prompt.images[0];
  return <Link href={`/p/${prompt.slug}`} className="community-card">
    <div className="community-cover">{cover&&!failed?
      // eslint-disable-next-line @next/next/no-img-element -- Published prompt image URLs.
      <img src={cover.url} alt={cover.label||prompt.title} loading="lazy" onError={()=>setFailed(true)}/>:<p>{prompt.description||"Abra para conhecer este prompt."}</p>}
      <span className="community-open" aria-hidden="true"><ArrowUpRight size={20}/></span>
    </div>
    <div className="community-card-info"><h3>{prompt.title}</h3>{prompt.model&&<span>{prompt.model}</span>}</div>
    <p className="community-author">por {prompt.creatorName||"Criador Mind"}</p>
  </Link>;
}
