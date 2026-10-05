'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Building2, ClipboardList, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { acceptInvitation, declineInvitation } from '@/lib/actions/invitations'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/actions/notifications'
import { formatDate } from '@/lib/types'
import { cn } from '@/lib/utils'

type OrgInvitationNotification = {
  id:        string
  type:      'org_invitation'
  token:     string
  orgName:   string
  orgSlug:   string
  role:      string
  createdAt: string
  expiresAt: string
}

type TaskAssignedNotification = {
  id:               string
  type:             'task_assigned'
  notificationId:   number
  taskId:           number | null
  taskTitle:        string
  taskSlug:         string | null
  orgSlug:          string | null
  fromUserName:     string
  createdAt:        string
}

type AppNotification = OrgInvitationNotification | TaskAssignedNotification

type AnimatedNotification = AppNotification & {
  phase: 'enter' | 'idle' | 'exit'
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'eier',
  admin: 'admin',
  member: 'medlem',
  viewer: 'leser',
}

const EXIT_MS = 280

function taskHref(notification: TaskAssignedNotification) {
  if (notification.orgSlug && notification.taskSlug) {
    return `/org/${notification.orgSlug}/${notification.taskSlug}`
  }
  if (notification.taskSlug) return `/tasks/${notification.taskSlug}`
  return null
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function NotificationCenter() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AnimatedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [actingOn, setActingOn] = useState<string | null>(null)
  const reducedMotion = useRef(false)
  const exitTimers = useRef(new Map<string, number>())

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion()
    return () => {
      for (const timer of exitTimers.current.values()) window.clearTimeout(timer)
      exitTimers.current.clear()
    }
  }, [])

  const mergeFromServer = useCallback((incoming: AppNotification[]) => {
    setItems((prev) => {
      const prevById = new Map(prev.map((item) => [item.id, item]))
      const nextIds = new Set(incoming.map((n) => n.id))
      const exitingIds = new Set(
        prev.filter((item) => item.phase === 'exit').map((item) => item.id),
      )
      const reduced = reducedMotion.current
      const isInitialFill = prev.length === 0

      const nextItems: AnimatedNotification[] = []

      for (const notification of incoming) {
        // Never resurrect a row that is mid-exit animation.
        if (exitingIds.has(notification.id)) continue

        const existing = prevById.get(notification.id)
        if (!existing) {
          nextItems.push({
            ...notification,
            phase: reduced || isInitialFill ? 'idle' : 'enter',
          })
          continue
        }

        nextItems.push({
          ...notification,
          phase: existing.phase === 'enter' ? 'enter' : 'idle',
        })
      }

      for (const item of prev) {
        if (nextIds.has(item.id) && item.phase !== 'exit') continue
        if (item.phase === 'exit') {
          nextItems.push(item)
        } else if (!nextIds.has(item.id) && !reduced) {
          nextItems.push({ ...item, phase: 'exit' })
        }
      }

      return nextItems
    })
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json() as { notifications: AppNotification[] }
      mergeFromServer(data.notifications ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [mergeFromServer])

  useEffect(() => {
    void loadNotifications()
    const interval = setInterval(() => { void loadNotifications() }, 30_000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  useEffect(() => {
    if (open) void loadNotifications()
  }, [open, loadNotifications])

  const finishExit = useCallback((id: string) => {
    const timer = exitTimers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      exitTimers.current.delete(id)
    }
    setItems((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const animateOut = useCallback((id: string) => {
    if (reducedMotion.current) {
      finishExit(id)
      return
    }

    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, phase: 'exit' } : n)),
    )

    const existing = exitTimers.current.get(id)
    if (existing) window.clearTimeout(existing)
    exitTimers.current.set(
      id,
      window.setTimeout(() => finishExit(id), EXIT_MS),
    )
  }, [finishExit])

  const animateOutMany = useCallback((ids: string[]) => {
    for (const id of ids) animateOut(id)
  }, [animateOut])

  const handleEnterEnd = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id && n.phase === 'enter' ? { ...n, phase: 'idle' } : n)),
    )
  }

  const handleAccept = async (notification: OrgInvitationNotification) => {
    setActingOn(notification.id)
    const result = await acceptInvitation(notification.token)
    setActingOn(null)

    if ('error' in result) {
      toast.error(result.error)
      void loadNotifications()
      return
    }

    toast.success(`Ble med i ${notification.orgName}`)
    animateOut(notification.id)
    setOpen(false)
    router.push(`/org/${notification.orgSlug}`)
    router.refresh()
  }

  const handleDecline = async (notification: OrgInvitationNotification) => {
    setActingOn(notification.id)
    const result = await declineInvitation(notification.token)
    setActingOn(null)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    toast.success('Invitasjonen ble avslått')
    animateOut(notification.id)
  }

  const handleDismissTask = async (notification: TaskAssignedNotification) => {
    setActingOn(notification.id)
    // Optimistically start exit so UI never feels stuck on a slow server action.
    animateOut(notification.id)

    const result = await markNotificationRead(notification.notificationId)
    setActingOn(null)

    if ('error' in result) {
      toast.error(result.error)
      void loadNotifications()
    }
  }

  const handleOpenTask = async (notification: TaskAssignedNotification) => {
    const href = taskHref(notification)
    if (!href) {
      toast.error('Kunne ikke åpne oppgaven')
      return
    }

    setActingOn(notification.id)
    animateOut(notification.id)

    const result = await markNotificationRead(notification.notificationId)
    setActingOn(null)

    if ('error' in result) {
      toast.error(result.error)
      void loadNotifications()
      return
    }

    setOpen(false)
    router.push(href)
    router.refresh()
  }

  const handleDismissAll = async () => {
    const taskNotes = items.filter(
      (n): n is AnimatedNotification & TaskAssignedNotification =>
        n.type === 'task_assigned' && n.phase !== 'exit',
    )
    if (taskNotes.length === 0) return

    setActingOn('all')
    animateOutMany(taskNotes.map((n) => n.id))

    const result = await markAllNotificationsRead()
    setActingOn(null)

    if ('error' in result) {
      toast.error(result.error)
      void loadNotifications()
    }
  }

  const activeItems = items.filter((n) => n.phase !== 'exit')
  const count = activeItems.length
  const taskCount = activeItems.filter((n) => n.type === 'task_assigned').length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="relative h-10 w-10">
          <Bell className="size-4" />
          {count > 0 && (
            <Badge
              variant="default"
              className="absolute -top-0.5 -right-0.5 size-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          )}
          <span className="sr-only">Varsler</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">Varsler</p>
            <p className="text-xs text-muted-foreground">
              {count === 0 ? 'Ingen nye varsler' : `${count} ventende`}
            </p>
          </div>
          {taskCount > 0 && (
            <button
              type="button"
              onClick={() => void handleDismissAll()}
              disabled={actingOn === 'all'}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
            >
              {actingOn === 'all' ? 'Fjerner…' : 'Fjern alle'}
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Laster…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Du er helt oppdatert.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    'px-4 py-3 flex flex-col gap-3',
                    notification.phase === 'enter' && 'slide-list-enter',
                    notification.phase === 'exit' && 'slide-list-exit',
                  )}
                  onAnimationEnd={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (notification.phase === 'exit') finishExit(notification.id)
                    if (notification.phase === 'enter') handleEnterEnd(notification.id)
                  }}
                >
                  {notification.type === 'org_invitation' ? (
                    <>
                      <div className="flex gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Building2 className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">
                            Invitasjon til {notification.orgName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Bli med som {ROLE_LABELS[notification.role] ?? notification.role} · utløper {formatDate(new Date(notification.expiresAt))}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          disabled={actingOn === notification.id || notification.phase === 'exit'}
                          onClick={() => void handleAccept(notification)}
                        >
                          {actingOn === notification.id ? 'Blir med…' : 'Godta'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={actingOn === notification.id || notification.phase === 'exit'}
                          onClick={() => void handleDecline(notification)}
                        >
                          Avslå
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <ClipboardList className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">
                            {notification.fromUserName} vil at du skal se på oppgaven
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notification.taskTitle}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground"
                          disabled={actingOn === notification.id || notification.phase === 'exit'}
                          onClick={() => void handleDismissTask(notification)}
                          aria-label="Fjern varsel"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          disabled={actingOn === notification.id || notification.phase === 'exit'}
                          onClick={() => void handleOpenTask(notification)}
                        >
                          {actingOn === notification.id ? 'Åpner…' : 'Åpne oppgave'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actingOn === notification.id || notification.phase === 'exit'}
                          onClick={() => void handleDismissTask(notification)}
                        >
                          Lukk
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
