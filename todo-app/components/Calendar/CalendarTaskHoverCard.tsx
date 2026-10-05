'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { notifyAllTaskAssignees } from '@/lib/actions/notifications'
import { DEFAULT_STATUS_LABELS } from '@/lib/statusDefaults'
import { resolveStatusIcon } from '@/lib/statusIcons'
import { assigneeDisplayName, assigneeInitials } from '@/lib/taskAssignees'
import { formatTaskScheduleRange } from '@/lib/taskSchedule'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CalendarTaskHoverCardProps {
  task: Task
  orgSlug: string
  canEdit?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function CalendarTaskHoverCard({
  task,
  orgSlug,
  canEdit = true,
  className,
  style,
  children,
}: CalendarTaskHoverCardProps) {
  const [notifyingAll, setNotifyingAll] = useState(false)
  const assignees = task.assignees ?? []
  const scheduleLabel = formatTaskScheduleRange(task.startAt, task.endAt)
  const status = task.status
  const statusLabel = status?.label ?? DEFAULT_STATUS_LABELS.todo
  const { Icon: StatusIcon, className: statusIconClass } = resolveStatusIcon(
    status?.icon,
    status?.color ?? 'gray',
  )

  const handleNotifyAll = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setNotifyingAll(true)
    const result = await notifyAllTaskAssignees(task.id)
    setNotifyingAll(false)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    const count = result.count ?? 0
    toast.success(
      count === 1 ? 'Varsling sendt til 1 person' : `Varsling sendt til ${count} personer`,
    )
  }

  return (
    <HoverCard openDelay={250} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Link
          href={`/org/${orgSlug}/${task.slug}`}
          className={className}
          style={style}
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="w-80 p-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold leading-snug">{task.title}</p>
            {task.group?.title && (
              <p className="mt-0.5 text-xs text-muted-foreground">{task.group.title}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">{scheduleLabel}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2">
            <StatusIcon className={cn('size-4 shrink-0', statusIconClass)} />
            <span className="text-sm font-medium">{statusLabel}</span>
          </div>

          {assignees.length > 0 ? (
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ansvarlige
                </span>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-7 shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
                    disabled={notifyingAll}
                    onClick={(event) => void handleNotifyAll(event)}
                  >
                    <Bell className="size-3.5" />
                    {notifyingAll ? 'Sender…' : 'Varsle alle'}
                  </Button>
                )}
              </div>
              <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                {assignees.map((user) => {
                  const label = assigneeDisplayName(user)
                  return (
                    <li
                      key={user.id}
                      className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-0.5"
                    >
                      <Avatar size="sm">
                        {user.avatarUrl ? (
                          <AvatarImage src={user.avatarUrl} alt={label} />
                        ) : null}
                        <AvatarFallback>{assigneeInitials(label)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Ingen ansvarlige</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
