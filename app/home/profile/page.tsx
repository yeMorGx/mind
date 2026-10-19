"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
export default function Page() {
 const { t } = useI18n();

  const { user, authReady } = useOnboarding();
  const router = useRouter();
  useEffect(() => { if (authReady) router.replace(user ? `/u/${user.uid}` : "/"); }, [user, authReady, router]);
  return <main className="min-h-[calc(100dvh-4.5rem)] bg-background p-8 text-muted"><p role="status">{t("Abrindo seu perfil…")}</p></main>;
}
