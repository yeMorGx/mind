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
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase/client";
import type { OnboardingData } from "@/lib/firebase/data";
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
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequest = useRef(0);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) return;

    return onAuthStateChanged(services.auth, async (nextUser) => {
      const requestId = ++profileRequest.current;
      setUser(nextUser);

      if (!nextUser) {
        setAuthReady(true);
        setData(initialData);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setAuthReady(true);
      try {
        const profileSnapshot = await getDoc(
          doc(services.db, "users", nextUser.uid),
        );
        const profile: Partial<OnboardingData> = profileSnapshot.exists()
          ? (profileSnapshot.data() as Partial<OnboardingData>)
          : {};
        if (profileRequest.current !== requestId) return;
        setData({
          ...initialData,
          ...profile,
          name: String(profile.name ?? nextUser.displayName ?? ""),
          email: String(profile.email ?? nextUser.email ?? ""),
          invitedEmails: Array.isArray(profile.invitedEmails)
            ? profile.invitedEmails.map(String)
            : [],
        });
        // Provision public identity separately so a publication error never blocks login.
        void ensureCreatorProfile(nextUser).catch(() => {
          console.warn("Não foi possível preparar o perfil público. Tente novamente no editor de perfil.");
        });
      } catch {
        if (profileRequest.current !== requestId) return;
        setData({
          ...initialData,
          name: nextUser.displayName ?? "",
          email: nextUser.email ?? "",
        });
      } finally {
        if (profileRequest.current === requestId) setProfileLoading(false);
      }
    });
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
