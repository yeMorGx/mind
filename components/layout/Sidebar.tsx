"use client";

import {
  Home,
  Folder,
  Star,
  Settings,
  User,
} from "lucide-react";

import Logo from "@/components/ui/logo";

export default function Sidebar() {
  return (
    <aside
      className="
        fixed
        left-0
        top-0
        z-40
        flex
        h-screen
        w-72
        flex-col
        border-r
        border-white/10
        bg-black/40
        backdrop-blur-xl
      "
    >
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-medium text-lg">
            Mind
          </span>
        </div>
      </div>

      <nav className="px-4">
        <SidebarItem
          icon={<Home size={18} />}
          label="Home"
          active
        />

        <SidebarItem
          icon={<Folder size={18} />}
          label="Collections"
        />

        <SidebarItem
          icon={<Star size={18} />}
          label="Favorites"
        />
      </nav>

      <div className="mx-4 my-6 border-t border-white/10" />

      <div className="px-4">
        <p className="mb-3 text-xs uppercase tracking-widest text-white/40">
          Workspaces
        </p>

        <SidebarItem label="Marketing" />
        <SidebarItem label="Development" />
        <SidebarItem label="Design" />
      </div>

      <div className="mt-auto p-4">
        <SidebarItem
          icon={<Settings size={18} />}
          label="Settings"
        />

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <User size={18} />
          </div>

          <div>
            <p className="text-sm font-medium">
              Gabriel
            </p>

            <p className="text-xs text-white/50">
              Pro Plan
            </p>
          </div>
        </div>
      </div>
    </aside>
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
        mb-1
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