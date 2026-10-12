"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Spotlight } from "@/components/ui/spotlight";
import  LoginModal  from "@/components/modal/modalLogin";
import { Instrument_Serif } from "next/font/google";
import { useOnboarding } from "@/app/context/OnboardingContext";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

const phrases = [
  "Build your personal prompt library.",
  "Never lose your prompts again.",
  "Store your ideas in one place.",
  "Keep every great prompt organized.",
  "A home for every prompt.",
];

export default function Landing() {
  const router = useRouter();
  const { user, authReady, profileLoading, data } = useOnboarding();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  useEffect(() => {
    if (!authReady || !user || profileLoading) return;
    if (data.onboardingComplete) {
      router.replace("/home");
      return;
    }
    if (!data.role) router.replace("/register/step-2");
    else if (!data.usageType) router.replace("/register/step-4");
    else if (data.usageType === "team" && !data.teamName) router.replace("/register/step-5");
    else router.replace("/register/step-7");
  }, [authReady, data, profileLoading, router, user]);

  const headline = phrases[0];

  return (
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
  );
}
