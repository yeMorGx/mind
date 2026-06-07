"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import React from "react";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import {
  Home,
  Folder,
  Star,
  Settings,
  User,
} from "lucide-react";

import Input from "@/components/ui/input";
import { Spotlight } from "@/components/ui/spotlight";
import Logo from "@/components/ui/logo";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

const prompts = [
  {
    title: "React Boilerplate",
    updated: "2h ago",
  },
  {
    title: "Landing Page Copy",
    updated: "5h ago",
  },
  {
    title: "Marketing GPT",
    updated: "1d ago",
  },
  {
    title: "Next.js SaaS",
    updated: "2d ago",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Spotlight />

      <Sidebar />
      <Header />

      {/* MAIN */}
      <main className="ml-72 flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-8">
          {/* HERO */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <motion.h1
              initial={{
                opacity: 0,
                filter: "blur(10px)",
                y: 15,
              }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
              }}
              transition={{
                duration: 1,
              }}
              className={`
                ${instrumentSerif.className}
                mb-8
                text-center
                text-5xl
              `}
            >
              Keep every great prompt organized.
            </motion.h1>

            <div className="w-full max-w-3xl">
              <Input />
            </div>

            <div className="mt-6 flex gap-3 text-sm text-white/40">
              <span>⌘K Search</span>
              <span>•</span>
              <span>⌘N New Prompt</span>
              <span>•</span>
              <span>⌘P Collections</span>
            </div>
          </div>

          {/* RECENT PROMPTS */}
          <section className="pb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">
                Recent Prompts
              </h2>

              <button className="text-sm text-white/50 hover:text-white">
                View all
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {prompts.map((prompt) => (
                <motion.div
                  key={prompt.title}
                  whileHover={{
                    y: -4,
                  }}
                  className="
                    cursor-pointer
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    p-5
                    backdrop-blur-md
                  "
                >
                  <h3 className="font-medium">
                    {prompt.title}
                  </h3>

                  <p className="mt-2 text-sm text-white/50">
                    Updated {prompt.updated}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        px-3
        py-2.5
        transition
        ${
          active
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}