import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

import { OnboardingProvider } from "./context/OnboardingContext";

export const metadata = {
  title: "Mind — prompts para criadores de IA",
  description: "Descubra prompts, veja os resultados e compartilhe suas criações com um link gratuito.",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className={cn("font-sans bg-background text-foreground")}>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </body>
    </html>
  );
}
