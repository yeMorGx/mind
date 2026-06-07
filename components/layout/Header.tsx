"use client";

import { Search, Bell } from "lucide-react";

export default function Header() {
  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-16
        items-center
        justify-between
        border-b
        border-white/10
        bg-black/30
        px-8
        backdrop-blur-xl
      "
    >
      <div>
        <h1 className="font-medium text-lg">
          Home
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-white/10
            px-4
            py-2
            text-sm
            text-white/60
          "
        >
          <Search size={16} />
          Search...
        </button>

        <button
          className="
            rounded-xl
            border
            border-white/10
            p-2
            text-white/60
          "
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}