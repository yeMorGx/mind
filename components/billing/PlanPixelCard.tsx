"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import PixelCard from "@/components/effects/PixelCard";

const subscribe = (notify: () => void) => {
 const query = window.matchMedia("(prefers-color-scheme: dark)");
 query.addEventListener("change", notify);
 return () => query.removeEventListener("change", notify);
};
export function useCardTheme() {
 const { theme } = useI18n();
 const systemDark = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-color-scheme: dark)").matches, () => false);
 return theme === "dark" || (theme === "system" && systemDark) ? "dark" : "light";
}
export default function PlanPixelCard({ children, featured = false, labelledBy, className = "" }: { children: ReactNode; featured?: boolean; labelledBy: string; className?: string }) {
 const theme = useCardTheme();
 return <PixelCard className={`billing-plan billing-pixel-plan${featured ? " billing-plan-featured" : ""} ${className}`} labelledBy={labelledBy} theme={theme} gap={8} speed={25} opacity={0.28} fade={0.85} glow={0.12} radius={16} origin="pointer" intro introDelay={featured ? 120 : 0} clickPulse={false}>{children}</PixelCard>;
}
