'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateTaskEditor } from './CreateTaskEditor'
import Link from 'next/link'
import { CreateTaskDeadline } from './CreateTaskDeadline'

interface Props {
  taskGroups: { id: number; title: string }[]
  orgId?: number
  orgSlug?: string
}

export function CreateTaskForm({ taskGroups, orgId, orgSlug }: Props) {
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState<Date | undefined>()
  const [state, action, isPending] = useActionState(createTask, null)

  const handleDeadlineChange = (date: Date | undefined) => {
    setDeadline(date)
  }

  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className="@container/main container mx-auto flex-1 flex flex-row">

        {/* Main content — matches TaskDetails main column exactly */}
        <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">


          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {state.error}
            </p>
          )}

          {orgId && <input type="hidden" name="orgId" value={orgId} />}
          {orgSlug && <input type="hidden" name="orgSlug" value={orgSlug} />}

          {/* Title — same classes as the h1 in TaskDetails */}
          <input
            name="title"
            required
            autoFocus
            placeholder="Task title..."
            className="text-5xl font-medium text-center sm:text-left font-heading bg-transparent border-none outline-none placeholder:text-muted-foreground text-heading-strong mb-6 w-full"
          />

          {/* Description */}
          <input type="hidden" name="description" value={description} />
          <CreateTaskEditor content={description} onChange={setDescription} />
        </div>

        {/* Sidebar — matches TaskDetails sidebar exactly */}
        <div className="flex flex-col gap-4 min-w-sm max-w-lg border-l px-8 py-12">
            {/* Action row — mirrors the Edit/Lagre + date row */}
            <div className="flex gap-3 items-center">
                <Button variant="brand" type="submit" disabled={isPending}>
                {isPending ? 'Oppretter...' : 'Opprett task'}
                </Button>
                <Button variant="ghost" type="button" asChild>
                <Link href="/tasks">Avbryt</Link>
                </Button>
            </div>
            <div className="flex items-center">
                <span className="w-1/2">Deadline:</span>
                <CreateTaskDeadline value={deadline} onChange={handleDeadlineChange} />
                
            </div>
            {taskGroups.length > 0 && (
                <div className="flex items-center">
                    
                    <span className="w-1/2">Group:</span>
                    <Select name="groupId">
                        <SelectTrigger className="">
                        <SelectValue placeholder="No group" />
                        </SelectTrigger>
                        <SelectContent className='p-1'>
                        {taskGroups.map((g) => (
                            <SelectItem key={g.id} value={String(g.id)}>
                            {g.title}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>

      </div>
    </form>
  )
}