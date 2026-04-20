'use client'

import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false)

  const handleLogout = async () => {
    setIsPending(true)
    toast.promise(authClient.signOut(), {
      loading: 'Logging out...',
      success: 'Logged out successfully',
      error:   'Failed to log out',
      finally: () => {
        window.location.href = '/api/auth/sign-in'
      },
    })
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      <LogOut className="size-4" />
      {isPending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}