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
    <GridMotion items={images} rows={5} aspectRatio={1.1} gap={12} radius={14}
      angle={-14} speed={12} parallax={0.2} spotlight={0} dim={0} fade={0.25} theme="light" />
  </div>;
}
