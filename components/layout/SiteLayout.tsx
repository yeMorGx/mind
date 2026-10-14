"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getFirebaseServices } from "@/lib/firebase/client";
import { getSupabaseClient } from "@/lib/supabase/client";
import { setNativeBackend } from "@/lib/backend";
import LoginModal from "@/components/modal/modalLogin";
import Header from "./Header";
import Sidebar, { type PromptView } from "./Sidebar";

const LayoutContext = createContext<{ searchValue: string; activeView: PromptView; setActiveView: (view: PromptView) => void } | null>(null);
export function useSiteLayout() {
  const value = useContext(LayoutContext);
  if (!value) throw new Error("A navegação precisa do layout do Mind.");
  return value;
}
export default function SiteLayout({ children }: { children: ReactNode }) {
  const { user, authReady, data } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeView, setActiveView] = useState<PromptView>("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");
  const library = pathname === "/home";
  const profileHref = user ? `/u/${user.uid}` : undefined;
  const title = library ? "Biblioteca" : pathname.startsWith("/u/") || pathname === "/home/profile" ? "Perfil do criador" : pathname.includes("/prompts/") || pathname.startsWith("/share/") || pathname.startsWith("/p/") ? "Prompt" : pathname.startsWith("/register") ? "Criar conta" : pathname.includes("/badges") ? "Emblemas" : pathname.startsWith("/auth/") ? "Sua conta" : "Explorar";
  function openLibrary(view: PromptView) {
    setMobileOpen(false);
    if (!user) { setLoginOpen(true); return; }
    setActiveView(view);
    if (!library) router.push("/home");
  }
  async function logout() {
    try {
      const supabase = getSupabaseClient();
      if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
      const services = getFirebaseServices();
      if (services) await signOut(services.auth);
      localStorage.removeItem("mind-native-session");
      setNativeBackend(false);
      window.dispatchEvent(new Event("mind:session"));
      setMobileOpen(false); setActiveView("all"); setSearchValue("");
      router.replace("/");
    } catch { setError("Não foi possível sair da conta. Tente novamente."); }
  }
  return <LayoutContext.Provider value={{ searchValue, activeView, setActiveView }}>
    <div className="min-h-screen bg-background text-foreground">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Sidebar pathname={pathname} activeView={activeView} profileHref={profileHref} userName={data.name || user?.displayName || "Minha conta"}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} onLibrary={openLibrary} onLogin={() => setLoginOpen(true)} onSignOut={() => void logout()} />
      <Header title={title} searchValue={library ? searchValue : undefined} onSearchChange={setSearchValue} mobileOpen={mobileOpen}
        onMenuClick={() => setMobileOpen(true)} profileHref={profileHref} onLogin={() => setLoginOpen(true)} authReady={authReady} />
      <div id="conteudo" tabIndex={-1} className="site-content pt-16 md:ml-20">
        {error && <div role="alert" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pt-5 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => setError("")} className="underline">Fechar</button></div>}
        {children}
      </div>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  </LayoutContext.Provider>;
}
