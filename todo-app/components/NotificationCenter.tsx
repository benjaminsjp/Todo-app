'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Building2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { acceptInvitation, declineInvitation } from '@/lib/actions/invitations'
import { formatDate } from '@/lib/types'

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

export function NotificationCenter() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<OrgInvitationNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [actingOn, setActingOn] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json() as { notifications: OrgInvitationNotification[] }
      setNotifications(data.notifications ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
    const interval = setInterval(() => { void loadNotifications() }, 30_000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  useEffect(() => {
    if (open) void loadNotifications()
  }, [open, loadNotifications])

  const handleAccept = async (notification: OrgInvitationNotification) => {
    setActingOn(notification.id)
    const result = await acceptInvitation(notification.token)
    setActingOn(null)

    if ('error' in result) {
      toast.error(result.error)
      void loadNotifications()
      return
    }

    toast.success(`Joined ${notification.orgName}`)
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
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

    toast.success('Invitation declined')
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
  }

  const count = notifications.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="relative h-10 w-10">
          <Bell className="size-4" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 size-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="font-medium">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {count === 0 ? 'No new notifications' : `${count} pending`}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              You're all caught up.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li key={notification.id} className="px-4 py-3 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Building2 className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">
                        Invitation to {notification.orgName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Join as {notification.role} · expires {formatDate(new Date(notification.expiresAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="brand"
                      size="sm"
                      className="flex-1"
                      disabled={actingOn === notification.id}
                      onClick={() => void handleAccept(notification)}
                    >
                      {actingOn === notification.id ? 'Joining…' : 'Accept'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={actingOn === notification.id}
                      onClick={() => void handleDecline(notification)}
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
