'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/types'
import { AvatarUpload } from './AvatarUpload'

interface Props {
  displayName: string
  email:       string
  avatarUrl:   string
  createdAt:   Date | null
}

export function ProfileForm({ displayName, email, avatarUrl, createdAt }: Props) {
  const [state, action, isPending] = useActionState(updateProfile, null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl)
  const toastId = useRef<string | number | undefined>(undefined)

  useEffect(() => {
    if (isPending) {
      toastId.current = toast.loading('Lagrer endringer...')
    }
  }, [isPending])

  // Resolve toast when action completes
  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      toast.success('Profil oppdatert!', { id: toastId.current })
    }
    if ('error' in state) {
      toast.error(state.error, { id: toastId.current })
    }
  }, [state])



  return (
    <form action={action} className="flex flex-col gap-5 ">
      <input type="hidden" name="avatarUrl" value={currentAvatarUrl} />

      <AvatarUpload
        currentUrl={currentAvatarUrl}
        displayName={displayName}
        onUpload={setCurrentAvatarUrl}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Visningsnavn</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>E-post</Label>
        <Input value={email} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">E-postadressen kan ikke endres.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Medlem siden</Label>
        <p className="text-sm text-muted-foreground">{formatDate(createdAt)}</p>
      </div>

      <div className="flex justify-end">
        <Button variant="brand" type="submit" disabled={isPending}>
          {isPending ? 'Lagrer...' : 'Lagre endringer'}
        </Button>
      </div>
    </form>
  )
}