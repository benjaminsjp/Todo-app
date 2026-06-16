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
      setError(result.error)
      return
    }

    window.location.href = '/org'
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <LogOut className="size-4" /> Leave organization
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave organization</DialogTitle>
            <DialogDescription>
              You will lose access to <strong>{orgName}</strong>. Type <strong>leave</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-leave">Confirmation</Label>
              <Input
                id="confirm-leave"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="leave"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleLeave}
                disabled={confirm !== 'leave' || isPending}
              >
                {isPending ? 'Leaving...' : 'Leave organization'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
