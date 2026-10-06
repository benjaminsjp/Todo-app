import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="flex flex-1 flex-col px-8 py-12" aria-busy="true" aria-label="Laster">
      <Skeleton className="mb-8 h-12 w-1/2 max-w-lg rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
