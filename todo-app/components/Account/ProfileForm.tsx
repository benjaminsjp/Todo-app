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
      toastId.current = toast.loading('Saving changes...')
    }
  }, [isPending])

  // Resolve toast when action completes
  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      toast.success('Profile updated!', { id: toastId.current })
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
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input value={email} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Member since</Label>
        <p className="text-sm text-muted-foreground">{formatDate(createdAt)}</p>
      </div>

      <div className="flex justify-end">
        <Button variant="brand" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}