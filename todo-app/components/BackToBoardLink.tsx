'use client'

import { useEffect } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function PendingHint() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return <Loader2 className="size-3.5 animate-spin opacity-70" aria-hidden />
}

/** Prefetches the board as soon as the task/create page mounts. */
export function BackToBoardLink({
  href,
  className,
  children = 'Tilbake til tavle',
}: {
  href: string
  className?: string
  children?: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    router.prefetch(href)
  }, [router, href])

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-2 w-fit text-muted-foreground', className)}
      asChild
    >
      <Link href={href} prefetch>
        <ArrowLeft className="size-4" />
        {children}
        <PendingHint />
      </Link>
    </Button>
  )
}

export function CancelToBoardLink({
  href,
  children = 'Avbryt',
}: {
  href: string
  children?: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    router.prefetch(href)
  }, [router, href])

  return (
    <Button variant="ghost" type="button" size="sm" asChild>
      <Link href={href} prefetch>
        {children}
        <PendingHint />
      </Link>
    </Button>
  )
}
