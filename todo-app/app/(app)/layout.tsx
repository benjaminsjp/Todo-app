import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { AppSidebarServer } from "@/components/sidebar/AppSidebarServer";
import AppMenubar from "@/components/menubar";
import { DemoBannerShell } from "@/components/DemoBannerShell";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbProvider } from "@/components/Breadcrumbs/BreadcrumbsContext";
import { auth } from '@/lib/auth/server'
import { isDemoUser } from '@/lib/demo/config'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "TODO App",
  description: "A simple TODO app built with Next.js 13 and styled with Tailwind CSS. Features include adding, editing, and deleting tasks, as well as a dark mode toggle for a better user experience.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const showDemoBanner = isDemoUser(session.user)

  return (
    <BreadcrumbProvider rootLabel="Home">
      <DemoBannerShell enabled={showDemoBanner}>
        <SidebarProvider
          className="min-h-0 flex-1"
          style={{ "--sidebar-width": "350px" } as CSSProperties}
        >
          <div className="flex h-full min-h-0 w-full">
            <AppSidebarServer />
            <main className="flex flex-1 flex-col w-full overflow-hidden">
              <AppMenubar />
              {children}
            </main>
          </div>
        </SidebarProvider>
      </DemoBannerShell>
    </BreadcrumbProvider>
  )
}
