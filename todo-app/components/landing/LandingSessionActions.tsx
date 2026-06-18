'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface LandingSessionActionsProps {
  isDemoSession: boolean
  size?: 'sm' | 'lg'
}

export function LandingSessionActions({
  isDemoSession,
  size = 'sm',
}: LandingSessionActionsProps) {
  const handleLeave = () => {
    window.location.href = '/api/auth/sign-out'
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="brand" size={size} asChild>
        <Link href="/dashboard">Åpne appen</Link>
      </Button>
      <Button variant="outline" size={size} onClick={handleLeave}>
        {isDemoSession ? 'Avslutt demo' : 'Logg ut'}
      </Button>
    </div>
  )
}
