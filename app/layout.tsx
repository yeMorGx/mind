import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import Image from "next/image";

import Logo from "@/components/ui/logo";

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
        
        <header className="fixed top-0 left-0 w-full flex items-center justify-end px-6 py-4 z-50">
          <Logo />
        </header>

        {children}

      </body>
    </html>
  );
}