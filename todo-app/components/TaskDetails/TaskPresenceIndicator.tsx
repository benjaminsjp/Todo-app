'use client'

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TaskPresence } from '@/lib/hooks/useOrgRealtime'
import { cn } from '@/lib/utils'

const VISIBLE_AVATARS = 4

function presenceName(p: TaskPresence) {
  return p.user?.displayName ?? p.user?.email ?? 'Noen'
}

function presenceInitials(p: TaskPresence) {
  const name = presenceName(p)
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

function presenceLabel(others: TaskPresence[]) {
  const editing = others.filter((p) => p.mode === 'editing')
  const viewing = others.filter((p) => p.mode !== 'editing')

  if (editing.length === 1 && viewing.length === 0) {
    return `${presenceName(editing[0]!)} redigerer`
  }
  if (viewing.length === 1 && editing.length === 0) {
    return `${presenceName(viewing[0]!)} ser på`
  }
  if (editing.length > 0 && viewing.length === 0) {
    return `${editing.length} redigerer`
  }
  if (viewing.length > 0 && editing.length === 0) {
    if (viewing.length === 2) {
      return `${presenceName(viewing[0]!)} og ${presenceName(viewing[1]!)} ser på`
    }
    return `${viewing.length} ser på`
  }

  const parts: string[] = []
  if (editing.length > 0) {
    parts.push(
      editing.length === 1
        ? `${presenceName(editing[0]!)} redigerer`
        : `${editing.length} redigerer`,
    )
  }
  if (viewing.length > 0) {
    parts.push(
      viewing.length === 1
        ? `${presenceName(viewing[0]!)} ser på`
        : `${viewing.length} ser på`,
    )
  }
  return parts.join(' · ')
}

export function TaskPresenceIndicator({
  others,
  className,
}: {
  others: TaskPresence[]
  className?: string
}) {
  if (others.length === 0) return null

  const editing = others.filter((p) => p.mode === 'editing')
  const visible = others.slice(0, VISIBLE_AVATARS)
  const overflow = others.length - visible.length
  const label = presenceLabel(others)

  return (
    <div
      className={cn(
        'flex w-fit max-w-full items-center gap-2 rounded-xl border bg-muted/40 px-2.5 py-1.5',
        editing.length > 0 && 'border-amber-500/25 bg-amber-500/10',
        className,
      )}
      aria-label={label}
    >
      <AvatarGroup className="-space-x-1.5">
        {visible.map((person) => (
          <Tooltip key={person.userId}>
            <TooltipTrigger asChild>
              <Avatar size="sm" className="size-6">
                <AvatarImage
                  src={person.user?.avatarUrl ?? undefined}
                  alt={presenceName(person)}
                />
                <AvatarFallback className="text-[10px]">
                  {presenceInitials(person)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                {presenceName(person)}
                {person.mode === 'editing' ? ' · redigerer' : ' · ser på'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <AvatarGroupCount className="size-6 text-[10px]">
            +{overflow}
          </AvatarGroupCount>
        )}
      </AvatarGroup>
      <p
        className={cn(
          'min-w-0 truncate text-xs text-muted-foreground',
          editing.length > 0 && 'text-amber-800 dark:text-amber-200',
        )}
      >
        {label}
      </p>
    </div>
  )
}
