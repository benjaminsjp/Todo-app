'use client'

import { TaskScheduleFields } from '@/components/CreateTask/TaskScheduleFields'
import { TaskAssigneeEditor } from '@/components/TaskAssignees/TaskAssigneeEditor'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TaskQuickEditValues } from '@/lib/taskQuickEdit'
import type { AssigneeOption, Status, TaskGroup, User } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskQuickEditFormProps {
  values: TaskQuickEditValues
  onChange: (patch: Partial<TaskQuickEditValues>) => void
  statuses: Status[]
  taskGroups: TaskGroup[]
  assigneeOptions: AssigneeOption[]
  assignees?: User[]
  taskId?: number
  disabled?: boolean
  statusDisabled?: boolean
  groupDisabled?: boolean
  scheduleDisabled?: boolean
  assigneesDisabled?: boolean
  variant?: 'dialog' | 'sidebar'
  isOrgTask?: boolean
}

export function TaskQuickEditForm({
  values,
  onChange,
  statuses,
  taskGroups,
  assigneeOptions,
  assignees = [],
  taskId,
  disabled = false,
  statusDisabled,
  groupDisabled,
  scheduleDisabled,
  assigneesDisabled = false,
  variant = 'dialog',
  isOrgTask = false,
}: TaskQuickEditFormProps) {
  const isSidebar = variant === 'sidebar'
  const showAssignees =
    isOrgTask || assigneeOptions.length > 0 || values.assigneeIds.length > 0
  const statusIsDisabled = statusDisabled ?? disabled
  const groupIsDisabled = groupDisabled ?? disabled
  const scheduleIsDisabled = scheduleDisabled ?? disabled

  const statusField = (
    <Select
      value={values.statusId}
      onValueChange={(value) => onChange({ statusId: value })}
      disabled={statusIsDisabled}
    >
      <SelectTrigger className={cn(isSidebar && 'shadow-none focus:ring-0 h-auto')}>
        <SelectValue placeholder="Velg status" />
      </SelectTrigger>
      <SelectContent className="p-1">
        {statuses.map((status) => (
          <SelectItem key={status.id} value={String(status.id)}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const groupField = (
    <Select
      value={values.groupId}
      onValueChange={(value) => onChange({ groupId: value })}
      disabled={groupIsDisabled}
    >
      <SelectTrigger className={cn(isSidebar && 'shadow-none focus:ring-0 h-auto')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="p-1">
        <SelectItem value="none">Ingen gruppe</SelectItem>
        {taskGroups.map((group) => (
          <SelectItem key={group.id} value={String(group.id)}>
            {group.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const scheduleField = (
    <TaskScheduleFields
      startAt={values.startAt}
      endAt={values.endAt}
      deadlinePriority={values.deadlinePriority}
      onStartChange={(startAt) => onChange({ startAt })}
      onEndChange={(endAt) => onChange({
        endAt,
        ...(endAt ? {} : { deadlinePriority: false }),
      })}
      onDeadlinePriorityChange={
        scheduleIsDisabled
          ? undefined
          : (deadlinePriority) => onChange({ deadlinePriority })
      }
      disabled={scheduleIsDisabled}
      compact={isSidebar}
    />
  )

  const assigneesField = showAssignees ? (
    <TaskAssigneeEditor
      className="w-full min-w-0"
      options={assigneeOptions}
      value={values.assigneeIds}
      onChange={(assigneeIds) => onChange({ assigneeIds })}
      assignees={assignees}
      taskId={taskId}
      disabled={assigneesDisabled}
      placeholder="Søk etter medlem…"
    />
  ) : null

  if (isSidebar) {
    return (
      <div className="flex flex-col gap-4">
        {statuses.length > 0 && (
          <div className="flex items-center">
            <span className="w-1/2">Status:</span>
            <div className="flex-1">{statusField}</div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Tidsrom</span>
          {scheduleField}
        </div>

        <div className="flex items-center">
          <span className="w-1/2">Gruppe:</span>
          <div className="flex-1">{groupField}</div>
        </div>

        {assigneesField && (
          <div className="min-w-0 border-t border-border pt-4">
            {assigneesField}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Status</Label>
        {statusField}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Gruppe</Label>
        {groupField}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tidsrom</Label>
        {scheduleField}
      </div>

      {assigneesField && (
        <div className="flex flex-col gap-1.5">
          <Label>Ansvarlige</Label>
          {assigneesField}
        </div>
      )}
    </div>
  )
}
