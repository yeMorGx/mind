import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import Image from "next/image";

import Logo from "@/components/ui/logo";
import { OnboardingProvider } from "./context/OnboardingContext";

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