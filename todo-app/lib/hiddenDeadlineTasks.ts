const storageKey = (userId: string) => `pan:hidden-deadline-tasks:${userId}`

export function getHiddenDeadlineTaskIds(userId: string): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(Number).filter((id) => Number.isFinite(id))
  } catch {
    return []
  }
}

export function hideDeadlineTaskId(userId: string, taskId: number) {
  const ids = new Set(getHiddenDeadlineTaskIds(userId))
  ids.add(taskId)
  window.localStorage.setItem(storageKey(userId), JSON.stringify([...ids]))
}
