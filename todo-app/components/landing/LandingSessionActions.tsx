'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { signOutApp } from '@/lib/actions/auth'

interface LandingSessionActionsProps {
  isDemoSession: boolean
  size?: 'sm' | 'lg'
}

export function LandingSessionActions({
  isDemoSession,
  size = 'sm',
}: LandingSessionActionsProps) {
  const [isPending, startTransition] = useTransition()

  const handleLeave = () => {
    startTransition(async () => {
      await signOutApp()
      window.location.href = '/'
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="brand" size={size} asChild>
        <Link href="/dashboard">Open app</Link>
      </Button>
      <Button variant="outline" size={size} onClick={handleLeave} disabled={isPending}>
        {isPending ? 'Leaving...' : isDemoSession ? 'Exit demo' : 'Sign out'}
      </Button>
    </div>
  )
}
