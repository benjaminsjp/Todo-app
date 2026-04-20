'use client'

import { useActionState } from 'react'
import { createStatus } from '@/lib/actions/statuses'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const COLORS = [
  { label: 'Gray',   value: 'gray',   class: 'bg-gray-500' },
  { label: 'Blue',   value: 'blue',   class: 'bg-blue-500' },
  { label: 'Green',  value: 'green',  class: 'bg-green-500' },
  { label: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
  { label: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { label: 'Red',    value: 'red',    class: 'bg-red-500' },
  { label: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { label: 'Pink',   value: 'pink',   class: 'bg-pink-500' },
]

interface Props {
  open:    boolean
  onClose: () => void
  orgId?:  number
}

export function CreateStatusModal({ open, onClose, orgId }: Props) {
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)

  const [state, action, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await createStatus(_prev, formData)
      if (!result?.error) onClose()
      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-sans font-medium">New status</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-6">
          {orgId && <input type="hidden" name="orgId" value={orgId} />}
          <input type="hidden" name="color" value={selectedColor} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label" className="pb-2">Name *</Label>
            <Input id="label" name="label" placeholder="E.g., In Review" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="pb-2">Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setSelectedColor(c.value)}
                  className={cn(
                    'w-7 h-7 rounded-full ring-offset-2 transition-all hover:scale-110',
                    c.class,
                    selectedColor === c.value && 'ring-2 ring-foreground scale-110'
                  )}
                />
              ))}
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create status'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}