"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase/client";
import type { OnboardingData } from "@/lib/firebase/data";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { bootstrapAccount } from "@/lib/supabase/mind";
import { setNativeBackend, type MindUser as User } from "@/lib/backend";
import { ensureCreatorProfile } from "@/lib/firebase/publication";

type ContextType = {
  data: OnboardingData;
  updateData: (values: Partial<OnboardingData>) => void;
  user: User | null;
  authReady: boolean;
  profileLoading: boolean;
  firebaseConfigured: boolean;
};

const initialData: OnboardingData = {
  name: "",
  email: "",
  role: "",
  source: "",
  usageType: "",
  teamName: "",
  teamSize: "",
  invitedEmails: [],
  workspaceName: "",
  workspaceIcon: "🧠",
  primaryWorkspaceId: "",
  onboardingComplete: false,
};

const OnboardingContext = createContext<ContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured && !isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequest = useRef(0);

  useEffect(() => {
    const services = getFirebaseServices();
    const supabase = getSupabaseClient();
    let firebaseUser: FirebaseUser | null = null;
    let nativeUserId = "";
    let alive = true;
    async function sync() {
      const requestId = ++profileRequest.current;
      setProfileLoading(true);
      try {
        if (supabase && localStorage.getItem("mind-native-session") === "1") {
          const { data: session, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (session.session) {
            const account = await bootstrapAccount();
            if (!alive || profileRequest.current !== requestId) return;
            setNativeBackend(true);
            nativeUserId = account.id;
            setUser({ uid: account.public_id, email: session.session.user.email ?? null,
              displayName: account.onboarding.name || account.creator_profile.name, photoURL: account.creator_profile.avatarUrl || null,
              backend: "supabase", getIdTokenResult: async () => ({ claims: { badgeAdmin: account.badge_admin } }) });
            setData({ ...initialData, ...account.onboarding });
            return;
          }
          localStorage.removeItem("mind-native-session");
        }
        if (!alive || profileRequest.current !== requestId) return;
        setNativeBackend(false);
        nativeUserId = "";
        setUser(firebaseUser);
        if (!firebaseUser || !services) { setData(initialData); return; }
        const current = firebaseUser;
        const snapshot = await getDoc(doc(services.db, "users", current.uid));
        if (!alive || profileRequest.current !== requestId) return;
        const profile = snapshot.data() as Partial<OnboardingData> | undefined;
        setData({ ...initialData, ...profile, name: String(profile?.name ?? current.displayName ?? ""),
          email: String(profile?.email ?? current.email ?? ""),
          invitedEmails: Array.isArray(profile?.invitedEmails) ? profile.invitedEmails.map(String) : [] });
        void ensureCreatorProfile(current).catch(() => console.warn("Não foi possível preparar o perfil público. Tente novamente no editor de perfil."));
      } catch {
        if (!alive || profileRequest.current !== requestId) return;
        // Never show an old Firebase library as if it were a failed native session.
        if (localStorage.getItem("mind-native-session") === "1") {
          setUser(null); setData(initialData);
        } else {
          setUser(firebaseUser); setData({ ...initialData, name: firebaseUser?.displayName ?? "", email: firebaseUser?.email ?? "" });
        }
      } finally {
        if (alive && profileRequest.current === requestId) { setAuthReady(true); setProfileLoading(false); }
      }
    }
    const unsubscribe = services ? onAuthStateChanged(services.auth, value => { firebaseUser = value; void sync(); }) : undefined;
    const nativeListener = supabase?.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user.id === nativeUserId) return;
      setTimeout(() => { if (alive) void sync(); }, 0);
    });
    const refresh = () => { void sync(); };
    window.addEventListener("mind:session", refresh);
    if (!services) void sync();
    return () => { alive = false; unsubscribe?.(); nativeListener?.data.subscription.unsubscribe(); window.removeEventListener("mind:session",refresh); };
  }, []);

  const updateData = useCallback((values: Partial<OnboardingData>) => {
    setData((previous) => ({ ...previous, ...values }));
  }, []);

  const contextValue = useMemo(
    () => ({
      data,
      updateData,
      user,
      authReady,
      profileLoading,
      firebaseConfigured: isFirebaseConfigured,
    }),
    [data, updateData, user, authReady, profileLoading],
  );

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }

  return context;
}
