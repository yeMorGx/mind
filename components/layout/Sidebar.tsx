"use client";

import { Home, LogOut, Star, User } from "lucide-react";
import type { ReactNode } from "react";
import Logo from "@/components/ui/logo";

export type PromptView = "all" | "favorites";

type SidebarProps = {
  activeView: PromptView;
  workspaceName: string;
  workspaceIcon: string;
  userName: string;
  onViewChange: (view: PromptView) => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export default function Sidebar({
  activeView,
  workspaceName,
  workspaceIcon,
  userName,
  onViewChange,
  onSignOut,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar navegação"
          onClick={onMobileClose}
          className="fixed inset-0 z-30 bg-black/70 md:hidden"
        />
      )}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-72 flex-col border-r border-white/10 bg-black/90 backdrop-blur-xl md:bg-black/40 ${mobileOpen ? "flex" : "hidden md:flex"}`}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-medium">Mind</span>
        </div>
      </div>

      <nav className="px-4" aria-label="Navegação principal">
        <SidebarItem
          icon={<Home size={18} />}
          label="All prompts"
          active={activeView === "all"}
          onClick={() => { onViewChange("all"); onMobileClose(); }}
        />
        <SidebarItem
          icon={<Star size={18} />}
          label="Favorites"
          active={activeView === "favorites"}
          onClick={() => { onViewChange("favorites"); onMobileClose(); }}
        />
      </nav>

      <div className="mx-4 my-6 border-t border-white/10" />

      <div className="px-4">
        <p className="mb-3 text-xs uppercase tracking-widest text-white/40">Workspace</p>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-white/70">
          <span aria-hidden="true">{workspaceIcon}</span>
          <span className="truncate">{workspaceName || "Meu workspace"}</span>
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName || "Mind user"}</p>
            <p className="text-xs text-white/50">Free plan</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { onSignOut(); onMobileClose(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
      </aside>
    </>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
