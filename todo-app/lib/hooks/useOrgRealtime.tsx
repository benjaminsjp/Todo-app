'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Status, Task, TaskGroup } from '@/lib/types'

export type TaskPresence = {
  taskId: number
  userId: string
  mode: string
  lastSeenAt: string
  user: { displayName: string | null; email: string; avatarUrl: string | null } | null
}

export function useOrgRealtime(orgId?: number) {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [statuses, setStatuses] = useState<Status[] | null>(null)
  const [taskGroups, setTaskGroups] = useState<TaskGroup[] | null>(null)
  const [presence, setPresence] = useState<TaskPresence[]>([])

  const esRef = useRef<EventSource | null>(null)

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
          setTasks(payload.tasks)
          setStatuses(payload.statuses)
          setTaskGroups(payload.taskGroups)
          setPresence(payload.presence ?? [])
        } else if (payload.type === 'org:presence') {
          setPresence(payload.presence ?? [])
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

  return { tasks, statuses, taskGroups, presence, presenceByTaskId }
}

