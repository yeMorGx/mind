"use client";

import { createContext, useContext, type ReactNode } from "react";
import dynamic from "next/dynamic";

const GridMotion = dynamic(() => import("@/components/ui/GridMotion"), { ssr: false });
const ArtworkContext = createContext<string[]>([]);

export function OnboardingArtworkProvider({ images, children }: { images: string[]; children: ReactNode }) {
  return <ArtworkContext.Provider value={images}>{children}</ArtworkContext.Provider>;
}

export default function OnboardingBackground() {
  const images = useContext(ArtworkContext);
  if (!images.length) return null;

  return <div className="onboarding-artwork" aria-hidden="true">
    <GridMotion items={images} rows={7} aspectRatio={1} gap={10} radius={12}
      angle={-10} speed={10} parallax={0.15} spotlight={0} dim={0} fade={0} theme="light" />
  </div>;
}
