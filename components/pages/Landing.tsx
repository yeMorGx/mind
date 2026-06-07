"use client";

import React from "react";
import { motion } from "framer-motion";

import Input from "@/components/ui/input";
import { Spotlight } from "@/components/ui/spotlight";
import  LoginModal  from "@/components/modal/modalLogin";
import { Instrument_Serif } from "next/font/google";

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [randomPhrase] = React.useState(() => {
    return phrases[Math.floor(Math.random() * phrases.length)];
  });

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
          {randomPhrase}
        </motion.h1>

        <Input onEnter={() => setIsModalOpen(true)} />
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