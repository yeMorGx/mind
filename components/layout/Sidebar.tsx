"use client";
import { Home, LogOut, Star, User, X } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
export type PromptView = "all" | "favorites";
type SidebarProps = { activeView: PromptView; workspaceName: string; workspaceIcon: string; userName: string; onViewChange: (view: PromptView) => void; onSignOut: () => void; mobileOpen: boolean; onMobileClose: () => void };
export default function Sidebar({ activeView, workspaceName, workspaceIcon, userName, onViewChange, onSignOut, mobileOpen, onMobileClose }: SidebarProps) {
  const itemClass = "group relative grid size-11 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white";
  return <>
    {mobileOpen && <button type="button" aria-label="Fechar navegação" onClick={onMobileClose} className="fixed inset-0 z-40 bg-black/70 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-20 flex-col items-center border-r border-white/10 bg-[#080808] py-4 ${mobileOpen ? "flex" : "hidden md:flex"}`}>
      <Link href="/home" aria-label="Mind — biblioteca" className="mb-8 grid size-12 place-items-center [&>svg]:size-20"><Logo /></Link>
      {mobileOpen && <button type="button" aria-label="Fechar navegação" onClick={onMobileClose} className={`${itemClass} mb-4 md:hidden`}><X size={19} /></button>}
      <nav aria-label="Navegação principal" className="flex flex-col gap-3">
        <button type="button" title="Todos os prompts" aria-label="Todos os prompts" aria-current={activeView === "all" ? "page" : undefined} onClick={() => { onViewChange("all"); onMobileClose(); }} className={`${itemClass} ${activeView === "all" ? "bg-white/10 text-white" : ""}`}><Home size={20} /></button>
        <button type="button" title="Favoritos" aria-label="Favoritos" aria-current={activeView === "favorites" ? "page" : undefined} onClick={() => { onViewChange("favorites"); onMobileClose(); }} className={`${itemClass} ${activeView === "favorites" ? "bg-white/10 text-white" : ""}`}><Star size={20} /></button>
        <Link href="/home/profile" title="Meu perfil de criador" aria-label="Meu perfil de criador" className={itemClass}><User size={20} /></Link>
      </nav>
      <div title={workspaceName} aria-label={`Workspace ${workspaceName}`} className="mt-8 grid size-10 place-items-center rounded-xl bg-white/5"><span aria-hidden="true">{workspaceIcon}</span></div>
      <div className="mt-auto flex flex-col items-center gap-3">
        <Link href="/home/profile" title={userName} aria-label={`Editar perfil de ${userName}`} className="grid size-9 place-items-center rounded-full bg-white/10 text-sm">{Array.from(userName)[0]?.toUpperCase() || "M"}</Link>
        <button type="button" title="Sair da conta" aria-label="Sair da conta" onClick={onSignOut} className={itemClass}><LogOut size={19} /></button>
      </div>
    </aside>
  </>;
}
