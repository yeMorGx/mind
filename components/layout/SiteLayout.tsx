"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getFirebaseServices } from "@/lib/firebase/client";
import { getSupabaseClient } from "@/lib/supabase/client";
import { setNativeBackend } from "@/lib/backend";
import { catalogCategory, type CatalogItem } from "@/lib/catalog";
import RequiredUsername from "@/components/profile/RequiredUsername";
import LoginModal from "@/components/modal/modalLogin";
import Header from "./Header";
type PromptView = "all" | "favorites";

type CatalogOptions = { path: string; categories: string[]; models: string[] };
type LayoutValue = {
  searchValue: string; setSearchValue: (value: string) => void; activeView: PromptView; category: string; model: string;
  setCategory: (value: string) => void; setModel: (value: string) => void;
  setCatalogOptions: (value: CatalogOptions) => void;
  newPromptOpen: boolean; newPromptVersion: number; openNewPrompt: () => void; closeNewPrompt: () => void;
};
const LayoutContext = createContext<LayoutValue | null>(null);
export function useSiteLayout() {
  const value = useContext(LayoutContext);
  if (!value) throw new Error("A navegação precisa do layout do Mind.");
  return value;
}
export function useCatalogOptions(items: CatalogItem[]) {
  const { setCatalogOptions } = useSiteLayout();
  const path = usePathname();
  const categories = useMemo(() => [...new Set(items.map(catalogCategory))].sort((a,b) => a.localeCompare(b,"pt-BR")), [items]);
  const models = useMemo(() => [...new Set(items.map(item => item.model).filter(Boolean))].sort((a,b) => a.localeCompare(b,"pt-BR")), [items]);
  useEffect(() => { setCatalogOptions({ path, categories, models }); }, [path, categories, models, setCatalogOptions]);
}
export default function SiteLayout({ children }: { children: ReactNode }) {
  const { user, authReady, data } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeView, setActiveView] = useState<PromptView>("all");
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [catalogOptions, updateCatalogOptions] = useState<CatalogOptions>({ path: "", categories: [], models: [] });
  const setCatalogOptions = useCallback((value: CatalogOptions) => updateCatalogOptions(value), []);
  const [newPromptOpen, setNewPromptOpen] = useState(false);
  const [newPromptVersion, setNewPromptVersion] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");
  const library = pathname === "/home";
  const profileHref = user ? `/u/${user.uid}` : undefined;
  const options = catalogOptions.path === pathname ? catalogOptions : { categories: [], models: [] };
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
  function search() { if ((!library || searchValue.trim().startsWith("@")) && pathname !== "/explore") { setCategory(""); setModel(""); router.push("/explore"); } }
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
  return <LayoutContext.Provider value={{ searchValue, setSearchValue, activeView, category, model, setCategory, setModel, setCatalogOptions, newPromptOpen, newPromptVersion, openNewPrompt, closeNewPrompt: () => setNewPromptOpen(false) }}>
    <div className="site-app min-h-screen bg-background text-foreground">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onSearch={search}
        profileHref={profileHref} userName={data.name || user?.displayName || "Minha conta"} onLogin={() => setLoginOpen(true)} authReady={authReady}
        onCreate={openNewPrompt} library={library} favorites={activeView === "favorites"} onLibrary={favorites => openLibrary(favorites ? "favorites" : "all")} onExplore={resetFilters} onSignOut={() => void logout()} />
      <div id="conteudo" tabIndex={-1} className="site-content pt-32 md:pt-18">
        {(options.categories.length > 0 || options.models.length > 0) && <div className="showcase-filters mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-3 px-5 pt-7 sm:px-8" aria-label="Filtros do catálogo">
          {options.categories.length > 0 && <label className="flex items-center gap-2 text-xs text-muted">Categoria<select value={category} onChange={event => setCategory(event.target.value)} className="h-10 max-w-44 rounded-full border border-border bg-surface px-3 text-sm text-foreground"><option value="">Todas</option>{options.categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
          {options.models.length > 0 && <label className="flex items-center gap-2 text-xs text-muted">Modelo<select value={model} onChange={event => setModel(event.target.value)} className="h-10 max-w-44 rounded-full border border-border bg-surface px-3 text-sm text-foreground"><option value="">Todos</option>{options.models.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
        </div>}
        {error && <div role="alert" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 pt-5 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => setError("")} className="underline">Fechar</button></div>}
        {children}
      </div>
      <RequiredUsername onLogout={logout} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  </LayoutContext.Provider>;
}
