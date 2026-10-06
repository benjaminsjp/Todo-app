'use client'

import { useActionState, useMemo, useRef, useState } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { CreateTaskEditor } from './CreateTaskEditor'
import { TaskTitleField } from '@/components/Task/TaskTitleField'
import { TaskSidebar } from '../TaskDetails/TaskSidebar'
import { BackToBoardLink } from '@/components/BackToBoardLink'
import { serializeTaskDateTime } from '@/lib/taskSchedule'
import type { Status } from '@/lib/types'

interface Props {
  taskGroups: { id: number; title: string }[]
  assigneeOptions: { value: string; label: string }[]
  statuses?: Status[]
  initialStatusId?: number | null
  orgId?: number
  orgSlug?: string
}

export function CreateTaskForm({
  taskGroups,
  assigneeOptions,
  statuses = [],
  initialStatusId = null,
  orgId,
  orgSlug,
}: Props) {
  const defaultStatus = useMemo(() => {
    if (initialStatusId != null) {
      return statuses.find((status) => status.id === initialStatusId) ?? statuses[0] ?? null
    }
    return statuses[0] ?? null
  }, [initialStatusId, statuses])

  const [description, setDescription] = useState('')
  const [startAt, setStartAt]         = useState<Date | undefined>()
  const [endAt, setEndAt]             = useState<Date | undefined>()
  const [deadlinePriority, setDeadlinePriority] = useState(false)
  const [groupId, setGroupId]         = useState<string>('none')
  const [assigneeIds, setAssigneeIds]   = useState<string[]>([])
  const [statusLabel, setStatusLabel] = useState(defaultStatus?.label ?? '')
  const [state, action, isPending]    = useActionState(createTask, null)
  const formRef = useRef<HTMLFormElement>(null)

  const statusId = useMemo(() => {
    const match = statuses.find((status) => status.label === statusLabel)
    return match?.id ?? defaultStatus?.id ?? null
  }, [statuses, statusLabel, defaultStatus])

  const submitWithModEnter = () => {
    if (isPending) return
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={action} className="flex flex-1 flex-col">
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
          <input type="hidden" name="statusId" value={statusId ?? ''} />
          <input type="hidden" name="startAt" value={serializeTaskDateTime(startAt) ?? ''} />
          <input type="hidden" name="endAt" value={serializeTaskDateTime(endAt) ?? ''} />
          <input type="hidden" name="deadlinePriority" value={deadlinePriority ? 'true' : ''} />
          {assigneeIds.map((id) => (
            <input key={id} type="hidden" name="assigneeIds" value={id} />
          ))}
          <input type="hidden" name="description" value={description} />

          <TaskTitleField name="title" required autoFocus onModEnter={submitWithModEnter} />
          <CreateTaskEditor
            content={description}
            onChange={setDescription}
            onModEnter={submitWithModEnter}
          />
        </div>

        <TaskSidebar
          mode="create"
          status={statusLabel}
          groupId={groupId}
          assigneeIds={assigneeIds}
          startAt={startAt}
          endAt={endAt}
          deadlinePriority={deadlinePriority}
          onStatusChange={setStatusLabel}
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
          statuses={statuses}
          assigneeOptions={assigneeOptions}
          cancelHref={orgSlug ? `/org/${orgSlug}` : '/tasks'}
          isPending={isPending}
        />
      </div>
    </form>
  )
}
