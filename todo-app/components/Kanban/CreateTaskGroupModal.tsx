'use client'

import { useActionState } from 'react'
import { createTaskGroup } from '@/lib/actions/taskGroups'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COLORS = [
  { label: 'Rosa',   value: 'bg-pink-500' },
  { label: 'Lilla',  value: 'bg-purple-500' },
  { label: 'Blå',    value: 'bg-blue-500' },
  { label: 'Grønn',  value: 'bg-green-500' },
  { label: 'Oransje',value: 'bg-orange-500' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateTaskGroupModal({ open, onClose }: Props) {
  const [state, action, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await createTaskGroup(formData)
      if (!result?.error) onClose()
      return result ?? null
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ny gruppe</DialogTitle>
        </DialogHeader>
        <DialogDescription>Add a new Task group</DialogDescription>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Navn *</Label>
            <Input id="title" name="title" placeholder="F.eks. Todo-app" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Farge</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <label key={c.value} className="cursor-pointer">
                  <input type="radio" name="color" value={c.value} className="sr-only" defaultChecked={c.value === 'bg-gray-500'} />
                  <span className={`block w-7 h-7 rounded-full ${c.value} ring-offset-2 has-[:checked]:ring-2 ring-foreground`} title={c.label} />
                </label>
              ))}
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Avbryt</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Oppretter...' : 'Opprett gruppe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}