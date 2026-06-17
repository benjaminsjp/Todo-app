'use client'

import { signOutApp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false)

  const handleLogout = async () => {
    setIsPending(true)
    try {
      await signOutApp()
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      <LogOut className="size-4" />
      {isPending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}
