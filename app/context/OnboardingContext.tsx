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
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/auth";
import { onboardingDataFromProfile } from "@/lib/supabase/data";
import type { OnboardingData } from "@/lib/supabase/types";

type ContextType = {
  data: OnboardingData;
  updateData: (values: Partial<OnboardingData>) => void;
  user: User | null;
  authReady: boolean;
  profileLoading: boolean;
  supabaseConfigured: boolean;
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
  creatorName: "",
  creatorIcon: "🧠",
  creatorSlug: "",
  onboardingComplete: false,
};

const OnboardingContext = createContext<ContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequest = useRef(0);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const requestId = ++profileRequest.current;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setData(initialData);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      queueMicrotask(() => {
        void (async () => {
          try {
            const profile = await ensureUserProfile(nextUser);
            if (profileRequest.current !== requestId) return;
            setData(onboardingDataFromProfile(profile as Record<string, unknown>, nextUser));
          } catch {
            if (profileRequest.current !== requestId) return;
            setData({
              ...initialData,
              name: String(nextUser.user_metadata?.full_name ?? nextUser.user_metadata?.name ?? ""),
              email: nextUser.email ?? "",
            });
          } finally {
            if (profileRequest.current === requestId) setProfileLoading(false);
          }
        })();
      });
    });

    return () => authListener.subscription.unsubscribe();
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
      supabaseConfigured: isSupabaseConfigured,
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
  if (!context) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return context;
}
