'use client'

import { useEffect } from 'react'

export function useTaskPresence(opts: {
  orgId?:   number | null
  taskId:   number
  enabled:  boolean
  mode?:    'editing' | 'viewing'
}) {
  const { orgId, taskId, enabled, mode = 'viewing' } = opts

  useEffect(() => {
    if (!enabled || !orgId) return

    const ping = async () => {
      try {
        await fetch('/api/presence/task', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ orgId, taskId, mode }),
        })
      } catch {
      }
    }

    void ping()
    const interval = setInterval(() => void ping(), 5000)

    return () => clearInterval(interval)

  }, [enabled, orgId, taskId, mode])

  useEffect(() => {
    if (!enabled || !orgId) return

    return () => {
      navigator.sendBeacon(
        `/api/presence/task?orgId=${orgId}&taskId=${taskId}`,
      )
      void fetch(`/api/presence/task?orgId=${orgId}&taskId=${taskId}`, {
        method:    'DELETE',
        keepalive: true, // sender requesten selv om siden lukkes
      })
    }
  }, [])
}