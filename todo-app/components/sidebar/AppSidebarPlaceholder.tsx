'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useDemoBanner } from '@/components/DemoBannerShell'
import { cn } from '@/lib/utils'
export function AppSidebarPlaceholder() {
  const { visible: demoBannerVisible } = useDemoBanner()

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-slot="sidebar"
      aria-busy="true"
      aria-label="Laster sidepanel"
    >
      <div
        data-slot="sidebar-gap"
        className="relative w-(--sidebar-width) shrink-0 bg-transparent"
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-0 left-0 z-10 hidden h-svh w-(--sidebar-width) flex-col border-r bg-sidebar md:flex',
          demoBannerVisible &&
            '!top-(--demo-banner-height) !bottom-auto !h-[calc(100svh-var(--demo-banner-height))]',
        )}
      >
        <div className="flex flex-col gap-3 border-b p-4">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-col gap-2 px-2 pt-3">
          {[72, 88, 64].map((width, i) => (
            <div key={`task-${i}`} className="flex items-center gap-2 px-2 py-3">
              <Skeleton className="size-3.5 shrink-0 rounded-sm" />
              <Skeleton className="h-4 rounded-md" style={{ width: `${width}%` }} />
            </div>
          ))}
          {[1, 2].map((i) => (
            <div key={`group-${i}`} className="mx-0 mt-2 rounded-xl px-2 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className="h-4 w-2/5 rounded-md" />
                <Skeleton className="ml-auto h-3 w-6 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
