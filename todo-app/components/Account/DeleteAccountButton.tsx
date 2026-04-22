'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/lib/actions/users'
import { Trash2 } from 'lucide-react'

export function DeleteAccountButton() {
  const [open,      setOpen]      = useState(false)
  const [confirm,   setConfirm]   = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteAccount()
    setIsDeleting(false)

    if ('error' in result) { setError(result.error ?? null); return }
    window.location.href = '/'
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" /> Delete account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your data. Type <strong>delete</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirmation</Label>
              <Input
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="delete"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirm !== 'delete' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}