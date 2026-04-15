'use client'

import { useActionState, useState } from 'react'
import { createTaskGroup } from '@/lib/actions/taskGroups'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const COLORS = [
  { label: 'Rosa',    value: 'bg-pink-500' },
  { label: 'Lilla',  value: 'bg-purple-500' },
  { label: 'Blå',    value: 'bg-blue-500' },
  { label: 'Grønn',  value: 'bg-green-500' },
  { label: 'Oransje',value: 'bg-orange-500' },
]

interface Props {
  open: boolean
  onClose: () => void
  orgId?: number
}

export function CreateTaskGroupModal({ open, onClose, orgId }: Props) {
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)

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
          <DialogTitle className='text-xl font-sans font-medium'>New taskgroup</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-6">
          {orgId && <input type="hidden" name="orgId" value={orgId} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className='pb-2'>Name *</Label>
            <Input id="title" name="title" placeholder="E.g., Todo-app" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className='pb-2'>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setSelectedColor(c.value)}
                  className={cn(
                    'w-7 h-7 rounded-full ring-offset-2 transition-all',
                    c.value,
                    selectedColor === c.value && 'ring-2 ring-foreground'
                  )}
                />
              ))}
            </div>
            {/* Pass selected color to form */}
            <input type="hidden" name="color" value={selectedColor} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}