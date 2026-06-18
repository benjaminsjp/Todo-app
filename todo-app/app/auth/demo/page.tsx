'use client'

import { useEffect, useState } from 'react'
import { startDemoSession } from './actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DemoPage() {
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Forbereder demomiljø…')

  useEffect(() => {
    let cancelled = false

    async function enterDemo() {
      setStatus('Laster eksempeldata…')
      const result = await startDemoSession()
      if (cancelled) return

      if (!result.success) {
        setError(result.error)
        return
      }

      window.location.href = '/dashboard'
    }

    enterDemo()

    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 w-full max-w-md mx-auto px-4 text-center">
      <div>
        <h1 className="text-3xl font-heading font-medium mb-2">Demomodus</h1>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{status}</p>
        )}
      </div>

      {error && (
        <div className="flex flex-col gap-3 w-full">
          <Button variant="brand" asChild>
            <Link href="/auth/sign-in">Opprett konto</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">Tilbake til forsiden</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
