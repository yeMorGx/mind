"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";

export function useOnboardingGuard() {
  const router = useRouter();
  const { user, authReady, profileLoading, firebaseConfigured } = useOnboarding();

  useEffect(() => {
    if (authReady && !user) router.replace("/register");
  }, [authReady, router, user]);

  return {
    user,
    ready: authReady && !profileLoading && Boolean(user),
    firebaseConfigured,
  };
}
