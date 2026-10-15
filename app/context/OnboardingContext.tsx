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
import { bootstrapAccount, getNativePublicCreator } from "@/lib/supabase/mind";
import { setNativeBackend, type MindUser as User } from "@/lib/backend";
import { ensureCreatorProfile } from "@/lib/firebase/publication";

type ContextType = {
  data: OnboardingData;
  updateData: (values: Partial<OnboardingData>) => void;
  user: User | null;
  authReady: boolean;
  profileLoading: boolean;
  firebaseConfigured: boolean;
  mfaRequired: boolean;
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
  const [mfaRequired, setMfaRequired] = useState(false);
  const profileRequest = useRef(0);

  useEffect(() => {
    const services = getFirebaseServices();
    const supabase = getSupabaseClient();
    let firebaseUser: FirebaseUser | null = null;
    let firebaseReady = !services;
    let nativeUserId = "";
    let alive = true;
    async function sync() {
      if (!firebaseReady) return;
      const requestId = ++profileRequest.current;
      const nativeRequested = localStorage.getItem("mind-native-session") === "1";
      setProfileLoading(true);
      try {
        if (supabase) {
          const preferred = nativeRequested;
          const { data: session, error } = await supabase.auth.getSession();
          if (error && preferred) throw error;
          const sameIdentity = !firebaseUser || session.session?.user.email?.toLowerCase() === firebaseUser.email?.toLowerCase();
          if (session.session && (preferred || sameIdentity)) {
            const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(session.session.access_token);
            if (assurance.error) throw assurance.error;
            if (assurance.data.nextLevel === "aal2" && assurance.data.currentLevel !== "aal2") {
              if (!alive || profileRequest.current !== requestId) return;
              setMfaRequired(true); setUser(null); setData(initialData); setNativeBackend(false);
              return;
            }
            let account = null;
            try { account = await bootstrapAccount(sessionStorage.getItem("mind-migration-source") || (preferred ? undefined : firebaseUser?.uid)); }
            catch (error) { if (preferred) throw error; }
            if (account) {
              if (!alive || profileRequest.current !== requestId) return;
              setMfaRequired(false);
              sessionStorage.removeItem("mind-migration-source");
              localStorage.setItem("mind-native-session", "1");
              sessionStorage.removeItem("mind-native-login-attempt");
              setNativeBackend(true);
              nativeUserId = account.id;
              setUser({ uid: account.public_id, email: session.session.user.email ?? null,
                displayName: account.onboarding.name || account.creator_profile.name, photoURL: account.creator_profile.avatarUrl || null,
                backend: "supabase", getIdTokenResult: async () => ({ claims: { badgeAdmin: account.badge_admin } }) });
              setData({ ...initialData, ...account.onboarding });
              return;
            }
          }
          if (preferred) localStorage.removeItem("mind-native-session");
          if (firebaseUser) {
            const migrated = await getNativePublicCreator(firebaseUser.uid);
            if (migrated?.backend === "supabase") {
              if (!alive || profileRequest.current !== requestId) return;
              // A migrated account must never fall back to an editable stale Firebase library.
              setUser(null); setData(initialData); setNativeBackend(false);
              return;
            }
          }
        }
        if (!alive || profileRequest.current !== requestId) return;
        setMfaRequired(false);
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
        if (nativeRequested || localStorage.getItem("mind-native-session") === "1") {
          setUser(null); setData(initialData);
        } else {
          setUser(firebaseUser); setData({ ...initialData, name: firebaseUser?.displayName ?? "", email: firebaseUser?.email ?? "" });
        }
      } finally {
        if (alive && profileRequest.current === requestId) { setAuthReady(true); setProfileLoading(false); }
      }
    }
    const unsubscribe = services ? onAuthStateChanged(services.auth, value => { firebaseUser = value; firebaseReady = true; void sync(); }) : undefined;
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
      mfaRequired,
    }),
    [data, updateData, user, authReady, profileLoading, mfaRequired],
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
