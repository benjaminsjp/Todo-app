'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, X } from 'lucide-react'
import { useDemoBanner } from './DemoBannerShell'

export function DemoBanner() {
  const { dismiss } = useDemoBanner()

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-(--demo-banner-height) w-full items-center bg-surface-3 border-b border-surface-2 px-4">
      <div className="flex w-full items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary shrink-0" />
          <span>
            You&apos;re exploring in <strong>demo mode</strong>. Changes are shared with other visitors and reset when you re-enter the demo.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="default" size="sm" asChild>
            <Link href="/auth/sign-in">Create account</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={dismiss}
            aria-label="Dismiss demo banner"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
