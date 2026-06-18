// components/CreateOrg/CreateOrgModal.tsx
'use client'

import { useActionState, useEffect } from 'react'
import { createOrganization } from '@/lib/actions/orgs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateOrgModal({ open, onClose }: Props) {
  const [state, action, isPending] = useActionState(createOrganization, null)

  useEffect(() => {
    if (state && 'slug' in state) {
      window.location.href = `/org/${state.slug}`
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm gap-2">
        <DialogHeader>
          <DialogTitle>Ny organisasjon</DialogTitle>
        </DialogHeader>
        <DialogDescription className='mb-4'>
          Opprett en ny organisasjon for å administrere oppgavene dine.
        </DialogDescription>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Navn *</Label>
            <Input id="name" name="name" placeholder="Organisasjonsnavn" required />
          </div>

          {state && 'error' in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Avbryt</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Oppretter...' : 'Opprett organisasjon'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
