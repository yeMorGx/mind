"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getFirebaseServices } from "@/lib/firebase/client";
import { getSupabaseClient } from "@/lib/supabase/client";
import { setNativeBackend } from "@/lib/backend";
import { catalogCategory, type CatalogItem } from "@/lib/catalog";
import { getOwnProfile } from "@/lib/firebase/publication";
import RequiredUsername from "@/components/profile/RequiredUsername";
import LoginModal from "@/components/modal/modalLogin";
import SocialProvider from "@/components/social/SocialProvider";
import Header from "./Header";
type PromptView = "all" | "favorites";

type LayoutValue = {
  searchValue: string; setSearchValue: (value: string) => void; activeView: PromptView; category: string; model: string;
  setCategory: (value: string) => void; setModel: (value: string) => void;
  requestLogin: () => void; signOut: () => Promise<void>;
  newPromptOpen: boolean; newPromptVersion: number; openNewPrompt: () => void; closeNewPrompt: () => void;
};
const LayoutContext = createContext<LayoutValue | null>(null);
export function useSiteLayout() {
  const value = useContext(LayoutContext);
  if (!value) throw new Error("A navegação precisa do layout do Mind.");
  return value;
}
export function useCatalogOptions(items: CatalogItem[]) {
  const categories = useMemo(() => [...new Set(items.map(catalogCategory))].sort((a,b) => a.localeCompare(b,"pt-BR")), [items]);
  const models = useMemo(() => [...new Set(items.map(item => item.model).filter(Boolean))].sort((a,b) => a.localeCompare(b,"pt-BR")), [items]);
  return {categories,models};
}
export default function SiteLayout({ children }: { children: ReactNode }) {
  const { user, authReady, data } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeView, setActiveView] = useState<PromptView>("all");
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [newPromptOpen, setNewPromptOpen] = useState(false);
  const [newPromptVersion, setNewPromptVersion] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");
  const [headerProfile,setHeaderProfile]=useState<{uid:string;avatar?:string;name?:string}|null>(null);
  const [profileVersion,setProfileVersion]=useState(0);
  const uid=user?.uid;
  useEffect(()=>{if(!uid)return;let alive=true;void getOwnProfile(uid).then(profile=>{if(alive)setHeaderProfile({uid,avatar:profile?.avatarUrl,name:profile?.name});}).catch(()=>{});return()=>{alive=false;};},[uid,profileVersion]);
  useEffect(()=>{const refresh=()=>setProfileVersion(value=>value+1);window.addEventListener("mind:username",refresh);return()=>window.removeEventListener("mind:username",refresh);},[]);
  const library = pathname === "/home";
  const profileHref = user ? `/u/${user.uid}` : undefined;
  function resetFilters() { setCategory(""); setModel(""); setSearchValue(""); }
  function openLibrary(view: PromptView) {
    resetFilters();
    if (!user) { setLoginOpen(true); return; }
    setActiveView(view);
    if (!library) router.push("/home");
  }
  function openNewPrompt() {
    if (!user) { setLoginOpen(true); return; }
    resetFilters(); setActiveView("all");
    setNewPromptVersion(value => value + 1); setNewPromptOpen(true);
    if (!library) router.push("/home");
  }
  function search(query = searchValue) {
    const term = query.trim().slice(0,80);
    setSearchValue(term); setCategory(""); setModel("");
    router.push(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
  }
  async function logout() {
    try {
      const supabase = getSupabaseClient();
      if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
      const services = getFirebaseServices();
      if (services) await signOut(services.auth);
      localStorage.removeItem("mind-native-session"); setNativeBackend(false);
      window.dispatchEvent(new Event("mind:session"));
      setActiveView("all"); setNewPromptOpen(false); resetFilters(); router.replace("/");
    } catch { setError("Não foi possível sair da conta. Tente novamente."); }
  }
  // The landing is protected and does not receive internal navigation or styles.
  if (pathname === "/") return children;
  return <LayoutContext.Provider value={{ signOut: logout, searchValue, setSearchValue, activeView, category, model, setCategory, setModel, requestLogin: () => setLoginOpen(true), newPromptOpen, newPromptVersion, openNewPrompt, closeNewPrompt: () => setNewPromptOpen(false) }}>
    <SocialProvider><div className="site-app min-h-screen bg-background text-foreground">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onSearch={search}
        profileHref={profileHref} userName={(headerProfile?.uid===uid?headerProfile?.name:undefined) || data.name || user?.displayName || "Minha conta"} photoUrl={headerProfile?.uid===uid?headerProfile?.avatar:undefined} googlePhotoUrl={user?.photoURL || undefined} onLogin={() => setLoginOpen(true)} authReady={authReady}
        onCreate={openNewPrompt} library={library} favorites={activeView === "favorites"} onLibrary={favorites => openLibrary(favorites ? "favorites" : "all")} onExplore={resetFilters} onSignOut={() => void logout()} />
      <div id="conteudo" tabIndex={-1} className="site-content pt-32 md:pt-18">
        {error && <div role="alert" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 pt-5 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => setError("")} className="underline">Fechar</button></div>}
        {children}
      </div>
      <RequiredUsername onLogout={logout} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div></SocialProvider>
  </LayoutContext.Provider>;
}
