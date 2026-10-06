import { Skeleton } from '@/components/ui/skeleton'

export function BoardPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-label="Laster tavle">
      <div className="container mx-auto flex flex-1 flex-col px-8 py-12">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <Skeleton className="mb-8 h-12 w-1/2 max-w-md rounded-lg" />
        <div className="flex min-h-[28rem] gap-4 overflow-hidden">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex w-72 shrink-0 flex-col gap-3">
              <Skeleton className="h-8 w-2/3 rounded-lg" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
