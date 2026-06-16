import Link from 'next/link'
import { CalendarDays, MessageCircle, Pencil, Eye } from 'lucide-react'
import { type Task } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { type TaskPresence } from '@/lib/hooks/useOrgRealtime'
import { getColor } from '@/lib/types'

interface TaskCardProps {
  task: Task
  orgSlug?: string
  presenceUsers?: TaskPresence[]
  currentUserId?: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function PresenceAvatar({ user, mode }: { user: TaskPresence['user']; mode: string }) {
  const name = user?.displayName || user?.email || '?'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar size="lg">
          <AvatarImage src={user?.avatarUrl ?? ''} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          <AvatarBadge className={`text-black ${mode === 'editing' ? getColor('bg-red-500').bg : getColor('bg-green-500').bg}`}>
          </AvatarBadge>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{name} — {mode === 'editing' ? 'Editing' : 'Viewing'}</p>
      </TooltipContent>
    </Tooltip>
  )
}
export function TaskCard({ task, orgSlug, presenceUsers = [], currentUserId }: TaskCardProps) {
  const groupColor = task.group?.color ?? null
  const href = orgSlug ? `/org/${orgSlug}/${task.slug}` : `/tasks/${task.slug}`
  const others = presenceUsers.filter((u) => u.userId !== currentUserId)
  return (
    <Link href={href}>
      <div className="group rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md hover:border-foreground/20 transition-all duration-200 cursor-pointer">
        <div className="flex items-center gap-2">
          {task.group && groupColor ? (
            <>
              <span className={`inline-block w-2 h-2 rounded-full ${groupColor}`} />
              <span className="text-xs text-muted-foreground">{task.group.title}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground"> </span>
          )}
          {others.length > 0 && (
            <div className="ml-auto flex">
              {others
                .sort((a, b) => (a.mode === 'editing' ? -1 : 1) - (b.mode === 'editing' ? -1 : 1))
                .slice(0, 3)
                .map((u) => (
                  <PresenceAvatar key={u.userId} user={u.user} mode={u.mode} />
                ))}
              {others.length > 3 && (
                <Avatar>
                  <AvatarFallback className="text-xs">+{others.length - 3}</AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </div>
        <p className="text-sm font-medium leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {stripHtml(task.description)}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          {task.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              {task.deadline}
            </div>
          )}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <MessageCircle className="size-3" />
              {task.comments.length}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}