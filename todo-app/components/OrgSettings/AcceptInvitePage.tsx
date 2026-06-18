'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { acceptInvitation } from '@/lib/actions/invitations'
import { Building2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  owner:  'Eier',
  admin:  'Admin',
  member: 'Medlem',
  viewer: 'Leser',
}

export function AcceptInvitePage({
  token, orgName, orgSlug, role, email,
}: {
  token: string; orgName: string; orgSlug: string; role: string; email: string
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const handleAccept = async () => {
    setIsPending(true)
    const result = await acceptInvitation(token)
    if ('error' in result) {
      setError(result.error)
      setIsPending(false)
      return
    }
    router.push(`/org/${orgSlug}`)
  }

  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 max-w-sm mx-auto text-center px-4">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-muted">
        <Building2 className="size-8" />
      </div>
      <div>
        <h1 className="text-3xl font-medium font-heading mb-2">Du er invitert!</h1>
        <p className="text-muted-foreground text-sm">
          Du er invitert til å bli med i <strong className="text-foreground">{orgName}</strong> som <strong className="text-foreground">{roleLabel}</strong>.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="brand" className="w-full" onClick={handleAccept} disabled={isPending}>
        {isPending ? 'Blir med...' : `Bli med i ${orgName}`}
      </Button>
    </div>
  )
}
