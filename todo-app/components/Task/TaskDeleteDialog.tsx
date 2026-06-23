'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TaskDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isDeleting?: boolean
  contentClassName?: string
}

export function TaskDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  contentClassName,
}: TaskDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-sm', contentClassName)}>
        <DialogHeader>
          <DialogTitle>Slett oppgave</DialogTitle>
          <DialogDescription>
            Er du sikker på at du vil slette denne oppgaven?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Avbryt
          </Button>
          <Button variant="destructive" onClick={() => void onConfirm()} disabled={isDeleting}>
            {isDeleting ? 'Sletter…' : 'Slett oppgave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
