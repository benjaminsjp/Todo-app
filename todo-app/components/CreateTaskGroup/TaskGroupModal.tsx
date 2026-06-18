// components/TaskGroup/TaskGroupModal.tsx
'use client'

import { useActionState, useState, useEffect } from 'react'
import { createTaskGroup, updateTaskGroup } from '@/lib/actions/taskGroups'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const COLORS = [
  { label: 'Rosa',    value: 'bg-pink-500' },
  { label: 'Lilla',   value: 'bg-purple-500' },
  { label: 'Blå',     value: 'bg-blue-500' },
  { label: 'Grønn',   value: 'bg-green-500' },
  { label: 'Oransje', value: 'bg-orange-500' },
  { label: 'Rød',     value: 'bg-red-500' },
  { label: 'Gul',     value: 'bg-yellow-500' },
  { label: 'Grå',     value: 'bg-gray-500' },
]

interface Props {
  open:    boolean
  onClose: () => void
  // Create mode
  orgId?:  number
  // Edit mode
  group?: {
    id:    number
    title: string
    color: string
  }
}

export function TaskGroupModal({ open, onClose, orgId, group }: Props) {
  const isEditing = !!group

  const [selectedColor, setSelectedColor] = useState(group?.color ?? COLORS[0].value)
  const [title, setTitle] = useState(group?.title ?? '')

  // Sync state when group prop changes (e.g. opening edit for different group)
  useEffect(() => {
    setSelectedColor(group?.color ?? COLORS[0].value)
    setTitle(group?.title ?? '')
  }, [group])

  const [state, action, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      if (isEditing) {
        const result = await updateTaskGroup(group.id, {
          title: formData.get('title') as string,
          color: formData.get('color') as string,
        })
        if (!('error' in result)) { onClose(); return null }
        return result
      } else {
        const result = await createTaskGroup(formData)
        if (!result?.error) { onClose(); return null }
        return result ?? null
      }
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm gap-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-sans font-medium">
            {isEditing ? 'Rediger gruppe' : 'Ny gruppe'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className='mb-4'>
          {isEditing
            ? 'Gjør endringer i gruppen og lagre dem.'
            : 'Opprett en ny gruppe for å organisere oppgavene dine.'}
        </DialogDescription>
        <form action={action} className="flex flex-col gap-6">
          {!isEditing && orgId && (
            <input type="hidden" name="orgId" value={orgId} />
          )}
          <input type="hidden" name="color" value={selectedColor} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="pb-2">Navn *</Label>
            <Input
              id="title"
              name="title"
              placeholder="F.eks. Todo-app"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="pb-2">Farge</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setSelectedColor(c.value)}
                  className={cn(
                    'w-7 h-7 rounded-full ring-offset-2 transition-all hover:scale-110',
                    c.value,
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
            <Button type="button" variant="outline" onClick={onClose}>Avbryt</Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              {isPending ? (isEditing ? 'Lagrer...' : 'Oppretter...') : (isEditing ? 'Lagre' : 'Opprett gruppe')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}