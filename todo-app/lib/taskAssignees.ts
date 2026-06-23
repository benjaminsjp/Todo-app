import type { AssigneeOption, User } from '@/lib/types'

type AssigneeRow = { user: User | null }

export function normalizeTaskAssignees<T extends { assignees?: AssigneeRow[] }>(
  row: T,
): Omit<T, 'assignees'> & { assignees: User[] } {
  const assignees = (row.assignees ?? [])
    .map((entry) => entry.user)
    .filter((user): user is User => user != null)

  const { assignees: _rows, ...rest } = row
  return { ...rest, assignees }
}

export function assigneeDisplayName(user: User): string {
  return user.displayName ?? user.email
}

export function assigneeShortLabel(user: User, maxLen = 12): string {
  const name = assigneeDisplayName(user)
  const first = name.split(/\s+/)[0] ?? name
  if (first.length <= maxLen) return first
  return `${first.slice(0, maxLen - 1)}…`
}

export function assigneeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

export function resolveAssigneeMembers(
  ids: string[],
  assignees: User[] = [],
  options: { value: string; label: string; avatarUrl?: string | null }[] = [],
): { id: string; label: string; avatarUrl: string | null }[] {
  const byId = new Map<string, { id: string; label: string; avatarUrl: string | null }>()

  for (const user of assignees) {
    byId.set(user.id, {
      id: user.id,
      label: assigneeDisplayName(user),
      avatarUrl: user.avatarUrl ?? null,
    })
  }
  for (const option of options) {
    if (!byId.has(option.value)) {
      byId.set(option.value, {
        id: option.value,
        label: option.label,
        avatarUrl: option.avatarUrl ?? null,
      })
    }
  }

  return ids.map((id) => byId.get(id)).filter((member): member is NonNullable<typeof member> => member != null)
}

export function mergeAssigneeOptionsForEditor(
  options: AssigneeOption[] = [],
  assignees: User[] = [],
): AssigneeOption[] {
  const byId = new Map(options.map((option) => [String(option.value), option]))

  for (const user of assignees) {
    if (!byId.has(user.id)) {
      byId.set(user.id, {
        value: user.id,
        label: assigneeDisplayName(user),
        avatarUrl: user.avatarUrl ?? null,
      })
    }
  }

  return [...byId.values()]
}

export function resolveAssigneeOptionsForTask(
  task: { orgId: number | null },
  orgAssigneeOptionsByOrgId: Record<number, AssigneeOption[]>,
  personalAssigneeOptions: AssigneeOption[],
): AssigneeOption[] {
  if (task.orgId) return orgAssigneeOptionsByOrgId[task.orgId] ?? []
  return personalAssigneeOptions
}

export function usersFromAssigneeIds(
  ids: string[],
  existing: User[] = [],
  options: AssigneeOption[] = [],
): User[] {
  return ids.map((id) => {
    const user = existing.find((entry) => entry.id === id)
    if (user) return user
    const option = options.find((entry) => entry.value === id)
    if (!option) return null
    return {
      id,
      displayName: option.label,
      avatarUrl: option.avatarUrl ?? null,
      email: option.label,
    }
  }).filter((user): user is User => user != null)
}

export const TASK_WITH_ASSIGNEES = {
  group: true,
  status: true,
  assignees: { with: { user: true } },
} as const
