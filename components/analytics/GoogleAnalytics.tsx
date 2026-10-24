"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analyticsHostAllowed, analyticsPathAllowed, GOOGLE_ANALYTICS_ID } from "@/lib/analytics/config";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  mindAnalyticsInitialized?: boolean;
  "ga-disable-G-PVW65CG68J"?: boolean;
};

export default function GoogleAnalytics({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const allowed = enabled && analyticsPathAllowed(pathname);

  useEffect(() => {
    const target = window as AnalyticsWindow;
    target["ga-disable-G-PVW65CG68J"] = !allowed;
  }, [allowed]);

  if (!allowed) return null;

  return <Script
    id="mind-google-analytics"
    src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
    strategy="afterInteractive"
    onReady={() => {
      const target = window as AnalyticsWindow;
      // Recheck the current address if navigation finished while the tag loaded.
      if (!analyticsHostAllowed(window.location.hostname) || !analyticsPathAllowed(window.location.pathname)) return;
      target["ga-disable-G-PVW65CG68J"] = false;
      if (target.mindAnalyticsInitialized) return;
      target.dataLayer = target.dataLayer || [];
      // eslint-disable-next-line prefer-rest-params -- Google's documented gtag command queue uses an Arguments object.
      target.gtag = function () { target.dataLayer!.push(arguments); };
      target.gtag("js", new Date());
      target.gtag("config", GOOGLE_ANALYTICS_ID, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: "none",
      });
      target.mindAnalyticsInitialized = true;
    }}
  />;
}
