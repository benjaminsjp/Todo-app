import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Noto_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import './globals.css'

export const dynamic = 'force-dynamic'

const notoSerifHeading = Noto_Serif({subsets:['latin'],variable:'--font-heading'});

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "På'n",
  description: "Oppgavestyring med Kanban-tavler, organisasjoner og sanntidssamarbeid.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="no" suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable, outfit.variable, notoSerifHeading.variable)}>
      <body className={cn('min-h-screen flex flex-col antialiased font-sans')}>
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  )
}