'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { CreateTaskEditor } from './CreateTaskEditor'
import { TaskSidebar } from '../TaskDetails/TaskSidebar'

interface Props {
  taskGroups: { id: number; title: string }[]
  orgId?: number
  orgSlug?: string
}

export function CreateTaskForm({ taskGroups, orgId, orgSlug }: Props) {
  const [description, setDescription] = useState('')
  const [deadline, setDeadline]       = useState<Date | undefined>()
  const [groupId, setGroupId]         = useState<string>('none')
  const [state, action, isPending]    = useActionState(createTask, null)

  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className="@container/main container mx-auto flex-1 flex flex-row">
        <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {state.error}
            </p>
          )}
          {orgId   && <input type="hidden" name="orgId"   value={orgId} />}
          {orgSlug && <input type="hidden" name="orgSlug" value={orgSlug} />}

          {/* Pass groupId to action */}
          <input type="hidden" name="groupId"     value={groupId === 'none' ? '' : groupId} />
          <input type="hidden" name="description" value={description} />

          <input
            name="title"
            required
            autoFocus
            placeholder="Task title..."
            className="text-5xl font-medium text-center sm:text-left font-heading bg-transparent border-none outline-none placeholder:text-muted-foreground text-heading-strong mb-6 w-full"
          />
          <CreateTaskEditor content={description} onChange={setDescription} />
        </div>

        <TaskSidebar
          mode="create"
          groupId={groupId}
          deadline={deadline}
          onDeadlineChange={setDeadline}
          onGroupChange={setGroupId}
          taskGroupOptions={taskGroups.map((g) => ({
            value: String(g.id),
            label: g.title,
            color: '',
          }))}
          cancelHref={orgSlug ? `/org/${orgSlug}` : '/tasks'}
          isPending={isPending}
        />
      </div>
    </form>
  )
}