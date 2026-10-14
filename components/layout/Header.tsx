"use client";

import { Menu, Search } from "lucide-react";

type HeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onMenuClick: () => void;
};

export default function Header({ searchValue, onSearchChange, onMenuClick }: HeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 md:left-20 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#080808]/95 px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenuClick} aria-label="Abrir navegação" className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white md:hidden">
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-medium">Biblioteca</h1>
      </div>
      <label className="relative block w-full max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <span className="sr-only">Buscar prompts</span>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar prompts…"
          className="w-full rounded-xl border border-white/10 bg-[#080808]/95 py-2 pl-10 pr-4 text-sm outline-none transition placeholder:text-white/40 focus:border-white/30"
        />
      </label>
    </header>
  );
}
