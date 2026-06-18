'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        window.location.href = '/api/auth/sign-out'
      }}
    >
      <LogOut className="size-4" />
      Logg ut
    </Button>
  )
}
