'use client'

import { useEffect, useRef } from 'react'

export function useTaskPresence(opts: { orgId?: number | null; taskId: number; enabled: boolean; mode?: 'editing' | 'viewing' }) {
  const { orgId, taskId, enabled, mode = 'editing' } = opts
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled || !orgId) return

    let stopped = false

    const ping = async () => {
      try {
        await fetch('/api/presence/task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId, taskId, mode }),
        })
      } catch {
        // ignore network errors; next ping will retry
      }
    }

    const stop = async () => {
      if (stopped) return
      stopped = true
      try {
        await fetch(`/api/presence/task?orgId=${orgId}&taskId=${taskId}`, { method: 'DELETE' })
      } catch {
        // ignore
      }
    }

    stopRef.current = () => { void stop() }

    void ping()
    const interval = setInterval(() => { void ping() }, 5000)

    return () => {
      clearInterval(interval)
      void stop()
    }
  }, [enabled, orgId, taskId, mode])
}

