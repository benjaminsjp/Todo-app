'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Status, Task, TaskGroup } from '@/lib/types'

export type TaskPresence = {
  taskId: number
  userId: string
  mode: string
  lastSeenAt: string
  user: { displayName: string | null; email: string; avatarUrl: string | null } | null
}

function presenceEqual(a: TaskPresence[], b: TaskPresence[]): boolean {
  if (a.length !== b.length) return false
  return a.every((p, i) => {
    const q = b[i]
    return (
      p.taskId === q.taskId &&
      p.userId === q.userId &&
      p.mode === q.mode
    )
  })
}

export function useOrgRealtime(orgId?: number) {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [statuses, setStatuses] = useState<Status[] | null>(null)
  const [taskGroups, setTaskGroups] = useState<TaskGroup[] | null>(null)
  const [presence, setPresence] = useState<TaskPresence[]>([])

  const esRef = useRef<EventSource | null>(null)

  useLayoutEffect(() => {
    setTasks(null)
    setStatuses(null)
    setTaskGroups(null)
    setPresence([])
  }, [orgId])

  useEffect(() => {
    if (!orgId) return

    const es = new EventSource(`/api/realtime/org/${orgId}`)
    esRef.current = es

    es.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data) as
          | { type: 'org:update'; tasks: Task[]; statuses: Status[]; taskGroups: TaskGroup[]; presence: TaskPresence[] }
          | { type: 'org:presence'; presence: TaskPresence[] }

        if (payload.type === 'org:update') {
          setTasks((prev) => {
            const next = payload.tasks
            if (prev && JSON.stringify(prev) === JSON.stringify(next)) return prev
            return next
          })
          setStatuses((prev) => {
            const next = payload.statuses
            if (prev && JSON.stringify(prev) === JSON.stringify(next)) return prev
            return next
          })
          setTaskGroups((prev) => {
            const next = payload.taskGroups
            if (prev && JSON.stringify(prev) === JSON.stringify(next)) return prev
            return next
          })
          setPresence((prev) => {
            const next = payload.presence ?? []
            if (presenceEqual(prev, next)) return prev
            return next
          })
        } else if (payload.type === 'org:presence') {
          setPresence((prev) => {
            const next = payload.presence ?? []
            if (presenceEqual(prev, next)) return prev
            return next
          })
        }
      } catch {
        // ignore malformed messages
      }
    }

    return () => {
      es.close()
      if (esRef.current === es) esRef.current = null
    }
  }, [orgId])

  const presenceByTaskId = useMemo(() => {
    const map = new Map<number, TaskPresence[]>()
    for (const p of presence) {
      const existing = map.get(p.taskId)
      if (existing) existing.push(p)
      else map.set(p.taskId, [p])
    }
    return map
  }, [presence])

  return {
    tasks,
    statuses,
    taskGroups,
    presence,
    presenceByTaskId,
    isLoading: orgId !== undefined && tasks === null,
  }
}

