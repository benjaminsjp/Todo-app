'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Editor from '@/components/TextEditor/TextEditor'

interface Props {
  open: boolean
  onClose: () => void
  taskGroups: { id: number; title: string }[]
}

export function CreateTaskModal({ open, onClose, taskGroups }: Props) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [state, action, isPending] = useActionState(createTask, null)

  useEffect(() => {
    if (state && 'success' in state) {
      router.refresh()
      onClose()
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ny task</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="Hva skal gjøres?" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Beskrivelse</Label>
            {/* Skjult input som holder HTML-verdien */}
            <input type="hidden" name="description" value={description} />
            <div className="rounded-lg border border-input overflow-hidden">
              <Editor content={description} onChange={setDescription} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" />
            </div>
            {taskGroups.length > 0 && (
              <div className="flex flex-col gap-1.5 flex-1">
                <Label>Gruppe</Label>
                <Select name="groupId">
                  <SelectTrigger>
                    <SelectValue placeholder="Ingen gruppe" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskGroups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>


          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Avbryt</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Oppretter...' : 'Opprett task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}