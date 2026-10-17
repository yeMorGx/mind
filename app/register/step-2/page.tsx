"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import CreatorSetupForm, { type CreatorSetupValues } from "@/components/onboarding/CreatorSetupForm";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useOnboardingGuard } from "@/lib/use-onboarding-guard";
import { saveOnboardingProgress } from "@/lib/firebase/data";
import { ensureCreatorProfile, getOwnProfile, saveCreatorProfile, profileSaveErrorMessage } from "@/lib/firebase/publication";
import { getUsername } from "@/lib/supabase/creators";

export default function CreatorStep() {
  const router = useRouter();
  const { user, ready } = useOnboardingGuard();
  const { data, updateData } = useOnboarding();
  const [identity, setIdentity] = useState<{ uid: string; username: string } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const uid = user?.uid;
  useEffect(() => {
    if (!ready || !uid) return;
    let alive = true;
    void getUsername(uid).then(username => {
      if (alive) { setIdentity({ uid, username: username ?? "" }); setError(false); }
    }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [uid, ready, attempt]);

  async function save(values: CreatorSetupValues) {
    if (!user) throw new Error("Entre novamente para continuar.");
    try {
      await ensureCreatorProfile(user);
      const current = await getOwnProfile(user.uid);
      await saveCreatorProfile(user.uid, { ...current, name: values.name, bio: current?.bio ?? "", username: values.username });
      await saveOnboardingProgress(user, { name: values.name, role: values.role });
      updateData({ name: values.name, role: values.role });
      window.dispatchEvent(new Event("mind:username"));
      router.push("/register/step-4");
    } catch (error) { throw new Error(profileSaveErrorMessage(error)); }
  }

  return <OnboardingLayout step={2}>
    {ready && user && identity && identity.uid === uid ? <CreatorSetupForm key={user.uid} publicId={user.uid} initialName={data.name || user.displayName || ""} initialUsername={identity.username} initialRole={data.role} save={save}/> : <>
      <h1>Seu perfil de criador.</h1>
      {error ? <div className="onboarding-status"><p role="alert">Não foi possível carregar seu @. Tente novamente.</p><button type="button" className="onboarding-back" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Tentar novamente</button></div> : <p role="status" className="onboarding-status">Carregando seu perfil…</p>}
    </>}
  </OnboardingLayout>;
}
