import type { AssigneeOption, Status, Task, TaskGroup } from '@/lib/types'
import { usersFromAssigneeIds } from '@/lib/taskAssignees'
import { parseTaskDateTime, serializeTaskDateTime } from '@/lib/taskSchedule'

export type TaskQuickEditValues = {
  statusId: string
  groupId: string
  startAt: Date | undefined
  endAt: Date | undefined
  assigneeIds: string[]
}

export function taskToQuickEditValues(
  task: Task,
  statuses: Status[],
): TaskQuickEditValues {
  return {
    statusId: task.status?.id
      ? String(task.status.id)
      : statuses[0]?.id
        ? String(statuses[0].id)
        : 'none',
    groupId: task.groupId ? String(task.groupId) : 'none',
    startAt: parseTaskDateTime(task.startAt),
    endAt: parseTaskDateTime(task.endAt),
    assigneeIds: (task.assignees ?? []).map((user) => user.id),
  }
}

export function quickEditValuesToTaskPatch(
  values: TaskQuickEditValues,
  task: Task,
  statuses: Status[],
  taskGroups: TaskGroup[],
  assigneeOptions: AssigneeOption[],
): {
  patch: Partial<Task>
  payload: {
    statusId: number | null
    groupId: number | null
    startAt: string | null
    endAt: string | null
    assigneeIds: string[]
  }
} {
  const statusById = new Map(statuses.map((status) => [status.id, status]))
  const groupById = new Map(taskGroups.map((group) => [group.id, group]))

  const nextStatus =
    values.statusId === 'none'
      ? null
      : statusById.get(Number(values.statusId)) ?? null
  const nextGroup =
    values.groupId === 'none'
      ? null
      : groupById.get(Number(values.groupId)) ?? null

  const startAt = serializeTaskDateTime(values.startAt)
  const endAt = serializeTaskDateTime(values.endAt)

  return {
    patch: {
      status: nextStatus,
      statusId: nextStatus?.id ?? null,
      group: nextGroup,
      groupId: nextGroup?.id ?? null,
      startAt: values.startAt ?? null,
      endAt: values.endAt ?? null,
      assignees: usersFromAssigneeIds(values.assigneeIds, task.assignees, assigneeOptions),
    },
    payload: {
      statusId: nextStatus?.id ?? null,
      groupId: nextGroup?.id ?? null,
      startAt,
      endAt,
      assigneeIds: values.assigneeIds,
    },
  }
}

export function quickEditValuesFromSidebar(
  statusLabel: string | undefined,
  groupId: string,
  startAt: Date | undefined,
  endAt: Date | undefined,
  assigneeIds: string[],
  statuses: Status[],
): TaskQuickEditValues {
  const statusMatch = statuses.find((status) => status.label === statusLabel)
  return {
    statusId: statusMatch
      ? String(statusMatch.id)
      : statuses[0]?.id
        ? String(statuses[0].id)
        : 'none',
    groupId,
    startAt,
    endAt,
    assigneeIds,
  }
}
