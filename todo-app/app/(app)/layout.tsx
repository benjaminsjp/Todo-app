import { Suspense } from 'react'
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { AppSidebarServer } from "@/components/sidebar/AppSidebarServer";
import { AppSidebarPlaceholder } from "@/components/sidebar/AppSidebarPlaceholder";
import { AppMenubarServer } from "@/components/AppMenubarServer";
import { DemoBannerShell } from "@/components/DemoBannerShell";
import { NavigationProgress } from "@/components/NavigationProgress";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbProvider } from "@/components/Breadcrumbs/BreadcrumbsContext";
import { auth } from '@/lib/auth/server'
import { UserReadyGate } from '@/lib/auth/UserReadyGate'
import { isDemoUser } from '@/lib/demo/config'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "På'n",
  description: "Oppgavestyring med Kanban-tavler, organisasjoner og sanntidssamarbeid.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const showDemoBanner = isDemoUser(session.user)

  return (
    <BreadcrumbProvider rootLabel="Hjem">
      <Suspense fallback={null}>
        <UserReadyGate user={session.user} />
      </Suspense>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <DemoBannerShell enabled={showDemoBanner}>
        <SidebarProvider
          className="h-full min-h-0 flex-1 overflow-hidden"
          style={{ "--sidebar-width": "350px" } as CSSProperties}
        >
          <div className="flex h-full min-h-0 w-full overflow-hidden">
            <Suspense fallback={<AppSidebarPlaceholder />}>
              <AppSidebarServer />
            </Suspense>
            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Suspense fallback={<div className="h-[73px] shrink-0 border-b" />}>
                <AppMenubarServer />
              </Suspense>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </DemoBannerShell>
    </BreadcrumbProvider>
  )
}
