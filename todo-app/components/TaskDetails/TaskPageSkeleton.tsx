import { Skeleton } from '@/components/ui/skeleton'

/** Shown while task / create-task routes load (RSC + data). */
export function TaskPageSkeleton() {
  return (
    <div className="@container/main container mx-auto flex flex-1 flex-row" aria-busy="true" aria-label="Laster side">
      <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <aside className="hidden w-80 shrink-0 border-l p-6 lg:block">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </aside>
    </div>
  )
}
