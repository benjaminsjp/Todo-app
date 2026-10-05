'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { notifyTaskAssignee } from '@/lib/actions/notifications'
import { assigneeInitials } from '@/lib/taskAssignees'

export type AssigneeMember = {
  id: string
  label: string
  avatarUrl: string | null
}

interface TaskAssigneeSelectedListProps {
  members: AssigneeMember[]
  onRemove: (id: string) => void
  taskId?: number
  disabled?: boolean
  canNotify?: boolean
  canRemove?: boolean
  className?: string
}

export function TaskAssigneeSelectedList({
  members,
  onRemove,
  taskId,
  disabled = false,
  canNotify = true,
  canRemove = true,
  className,
}: TaskAssigneeSelectedListProps) {
  const [notifyingId, setNotifyingId] = useState<string | null>(null)

  if (members.length === 0) return null

  const handleNotify = async (member: AssigneeMember) => {
    if (!taskId) {
      toast.error('Lagre oppgaven først for å sende varsling')
      return
    }

    setNotifyingId(member.id)
    const result = await notifyTaskAssignee(taskId, member.id)
    setNotifyingId(null)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    toast.success(`Varsling sendt til ${member.label}`)
  }

  return (
    <ul className={`flex min-w-0 flex-col gap-1 ${className ?? ''}`}>
      {members.map((member) => (
        <li
          key={member.id}
          className="flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-2 py-1.5"
        >
          <Avatar size="sm">
            {member.avatarUrl ? (
              <AvatarImage src={member.avatarUrl} alt={member.label} />
            ) : null}
            <AvatarFallback>{assigneeInitials(member.label)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm">{member.label}</span>
          {canNotify && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              disabled={disabled || notifyingId === member.id}
              aria-label={`Varsle ${member.label}`}
              onClick={() => void handleNotify(member)}
            >
              <Bell className="size-3.5" />
            </Button>
          )}
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              aria-label={`Fjern ${member.label}`}
              onClick={() => onRemove(member.id)}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}
