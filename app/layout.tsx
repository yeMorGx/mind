import "./globals.css";
import "./dark-surfaces.css";
import "./preferences.css";
import { cookies, headers } from "next/headers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { analyticsHostAllowed } from "@/lib/analytics/config";
import PreferencesProvider from "@/components/preferences/PreferencesProvider";
import { isLocale, isTheme } from "@/lib/i18n/config";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

import SiteLayout from "@/components/layout/SiteLayout";
import { OnboardingProvider } from "./context/OnboardingContext";

export const metadata = {
  title: "Mind — your prompt library",
  description: "Save, organize and discover prompts in one place.",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const saved = await cookies();
  const host = (await headers()).get("host") || "";
  const localeCookie = saved.get("mind-locale")?.value;
  const themeCookie = saved.get("mind-theme")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : "en";
  const theme = isTheme(themeCookie) ? themeCookie : "light";
  return (
    <html lang={locale} data-theme={theme === "dark" ? "dark" : "light"} className={geist.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(()=>{try{const root=document.documentElement;const theme=${JSON.stringify(theme)};root.dataset.theme=location.pathname==='/'?'light':theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;}catch{}})();` }}/></head>
      <body className={cn("font-sans bg-background text-foreground")}>
        <GoogleAnalytics enabled={analyticsHostAllowed(host)} />
        <PreferencesProvider initialLocale={locale} initialTheme={theme}>
        <OnboardingProvider>
          <SiteLayout>{children}</SiteLayout>
        </OnboardingProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
