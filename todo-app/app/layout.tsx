import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Noto_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { AppSidebarServer } from "@/components/sidebar/AppSidebarServer";
import { SidebarInset } from "@/components/ui/sidebar";
import AppMenubar from "@/components/menubar";

import { auth } from '@/lib/auth/server'
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
  title: "TODO App",
  description: "A simple TODO app built with Next.js 13 and styled with Tailwind CSS. Features include adding, editing, and deleting tasks, as well as a dark mode toggle for a better user experience.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  
  const { data: session } = await auth.getSession()

  if (session?.user) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "min-h-screen flex flex-col antialiased font-sans",
            outfit.variable,
            notoSerifHeading.variable,
            geistSans.variable,
            geistMono.variable
          )}
        >
          <Providers>
            <AppSidebarServer />
              <main className="flex flex-1 flex-col">
                <AppMenubar />
                {children}
              </main>
          </Providers>
        </body>
      </html>
    );
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen flex flex-col antialiased font-sans",
          outfit.variable,
          notoSerifHeading.variable,
          geistSans.variable,
          geistMono.variable
        )}
      >
        <Providers>
            <main className="flex flex-1 flex-col">
              {children}
            </main>
        </Providers>
      </body>
    </html>
  )
}
