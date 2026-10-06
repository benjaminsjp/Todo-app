'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { CreateTaskEditor } from './CreateTaskEditor'
import { TaskTitleField } from '@/components/Task/TaskTitleField'
import { TaskSidebar } from '../TaskDetails/TaskSidebar'
import { BackToBoardLink } from '@/components/BackToBoardLink'
import { serializeTaskDateTime } from '@/lib/taskSchedule'

interface Props {
  taskGroups: { id: number; title: string }[]
  assigneeOptions: { value: string; label: string }[]
  orgId?: number
  orgSlug?: string
}

export function CreateTaskForm({ taskGroups, assigneeOptions, orgId, orgSlug }: Props) {
  const [description, setDescription] = useState('')
  const [startAt, setStartAt]         = useState<Date | undefined>()
  const [endAt, setEndAt]             = useState<Date | undefined>()
  const [deadlinePriority, setDeadlinePriority] = useState(false)
  const [groupId, setGroupId]         = useState<string>('none')
  const [assigneeIds, setAssigneeIds]   = useState<string[]>([])
  const [state, action, isPending]    = useActionState(createTask, null)

  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className="@container/main container mx-auto flex-1 flex flex-row">
        <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">
          <BackToBoardLink href={orgSlug ? `/org/${orgSlug}` : '/tasks'} />
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {state.error}
            </p>
          )}
          {orgId   && <input type="hidden" name="orgId"   value={orgId} />}
          {orgSlug && <input type="hidden" name="orgSlug" value={orgSlug} />}

          <input type="hidden" name="groupId" value={groupId === 'none' ? '' : groupId} />
          <input type="hidden" name="startAt" value={serializeTaskDateTime(startAt) ?? ''} />
          <input type="hidden" name="endAt" value={serializeTaskDateTime(endAt) ?? ''} />
          <input type="hidden" name="deadlinePriority" value={deadlinePriority ? 'true' : ''} />
          {assigneeIds.map((id) => (
            <input key={id} type="hidden" name="assigneeIds" value={id} />
          ))}
          <input type="hidden" name="description" value={description} />

          <TaskTitleField name="title" required autoFocus />
          <CreateTaskEditor content={description} onChange={setDescription} />
        </div>

        <TaskSidebar
          mode="create"
          groupId={groupId}
          assigneeIds={assigneeIds}
          startAt={startAt}
          endAt={endAt}
          deadlinePriority={deadlinePriority}
          onStartChange={setStartAt}
          onEndChange={(value) => {
            setEndAt(value)
            if (!value) setDeadlinePriority(false)
          }}
          onDeadlinePriorityChange={setDeadlinePriority}
          onGroupChange={setGroupId}
          onAssigneesChange={setAssigneeIds}
          taskGroupOptions={taskGroups.map((g) => ({
            value: String(g.id),
            label: g.title,
            color: '',
          }))}
          assigneeOptions={assigneeOptions}
          cancelHref={orgSlug ? `/org/${orgSlug}` : '/tasks'}
          isPending={isPending}
        />
      </div>
    </form>
  )
}
