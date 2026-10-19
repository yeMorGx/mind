import type { ReactNode } from "react";
import { getPublicPrompts } from "@/lib/supabase/server-data";
import { OnboardingArtworkProvider } from "@/components/onboarding/OnboardingBackground";

export const dynamic = "force-dynamic";

export default async function RegisterLayout({ children }: { children: ReactNode }) {
  const prompts = await getPublicPrompts(60).catch(() => []);
  const images = [...new Set(prompts.flatMap(prompt => prompt.images
    .filter(image => image.role === "gallery" || image.role === "after")
    .map(image => image.url)
    .filter(url => /^https?:\/\//i.test(url))))].slice(0, 24);

  return <OnboardingArtworkProvider images={images}>{children}</OnboardingArtworkProvider>;
}
