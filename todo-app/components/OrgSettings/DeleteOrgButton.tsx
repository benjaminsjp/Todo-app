'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteOrganization } from '@/lib/actions/orgs'
import { Trash2 } from 'lucide-react'

export function DeleteOrgButton({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsPending(true)
    setError(null)
    const result = await deleteOrganization(orgSlug)
    setIsPending(false)

    if ('error' in result) {
      setError(result.error ?? 'Kunne ikke slette organisasjonen')
      return
    }

    window.location.href = '/org'
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> Slett organisasjon
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Slett organisasjon</DialogTitle>
            <DialogDescription>
              Dette vil permanent slette <strong>{orgName}</strong> og alle oppgaver, medlemmer og data. Skriv <strong>slett</strong> for å bekrefte.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-delete-org">Bekreftelse</Label>
              <Input
                id="confirm-delete-org"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="slett"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirm !== 'slett' || isPending}
              >
                {isPending ? 'Sletter...' : 'Slett organisasjon'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
