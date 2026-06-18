'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { leaveOrganization } from '@/lib/actions/orgs'
import { LogOut } from 'lucide-react'

export function LeaveOrgButton({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLeave = async () => {
    setIsPending(true)
    setError(null)
    const result = await leaveOrganization(orgSlug)
    setIsPending(false)

    if ('error' in result) {
      setError(result.error ?? 'Kunne ikke forlate organisasjonen')
      return
    }

    window.location.href = '/org'
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <LogOut className="size-4" /> Forlat organisasjon
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Forlat organisasjon</DialogTitle>
            <DialogDescription>
              Du mister tilgang til <strong>{orgName}</strong>. Skriv <strong>forlat</strong> for å bekrefte.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-leave">Bekreftelse</Label>
              <Input
                id="confirm-leave"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="forlat"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button
                variant="destructive"
                onClick={handleLeave}
                disabled={confirm !== 'forlat' || isPending}
              >
                {isPending ? 'Forlater...' : 'Forlat organisasjon'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
