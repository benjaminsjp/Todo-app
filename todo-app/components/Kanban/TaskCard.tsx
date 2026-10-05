'use client'

import { formatTaskScheduleLabel } from '@/lib/taskSchedule'
import { CalendarClock, MessageCircle } from 'lucide-react'
import { TaskAssigneeAvatars } from '@/components/TaskAssignees/TaskAssigneeAvatars'
import { useKanbanOverlayLocked } from '@/components/Kanban/KanbanOverlayLock'
import { type Status, type Task, type TaskGroup, type AssigneeOption } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { type TaskPresence } from '@/lib/hooks/useOrgRealtime'
import { TaskOptionsMenu } from './TaskOptionsMenu'
import { useRouter } from 'next/navigation'

interface TaskCardProps {
  task: Task
  orgSlug?: string
  presenceUsers?: TaskPresence[]
  currentUserId?: string
  statuses?: Status[]
  taskGroups?: TaskGroup[]
  assigneeOptions?: AssigneeOption[]
  canEdit?: boolean
  onOptimisticPatch?: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback?: (taskId: number, prev: Task) => void
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function PresenceDot({ others }: { others: TaskPresence[] }) {
  const total = others.length
  if (total === 0) return null

  const editing = others.filter((o) => o.mode === 'editing')
  const viewing = others.filter((o) => o.mode !== 'editing')

  const colorClass =
    editing.length > 0 ? 'bg-red-500' : 'bg-green-500'

  const tooltip = [
    editing.length > 0
      ? `Redigerer (${editing.length}): ${editing.map((u) => u.user?.displayName ?? u.user?.email ?? 'Noen').join(', ')}`
      : null,
    viewing.length > 0
      ? `Ser på (${viewing.length}): ${viewing.map((u) => u.user?.displayName ?? u.user?.email ?? 'Noen').join(', ')}`
      : null,
  ].filter(Boolean).join('\n')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-1.5 select-none"
          aria-label={tooltip.replace(/\n/g, ' · ')}
        >
          <span className={`inline-block size-2 rounded-full ${colorClass}`} />
          {total > 1 && (
            <span className="text-[10px] leading-none text-muted-foreground tabular-nums">
              {total}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs whitespace-pre-wrap">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
export function TaskCard({
  task,
  orgSlug,
  presenceUsers = [],
  currentUserId,
  statuses = [],
  taskGroups = [],
  assigneeOptions = [],
  canEdit = true,
  onOptimisticPatch,
  onOptimisticRollback,
}: TaskCardProps) {
  const router = useRouter()
  const overlayLocked = useKanbanOverlayLocked()
  const groupColor = task.group?.color ?? null
  const href = orgSlug ? `/org/${orgSlug}/${task.slug}` : `/tasks/${task.slug}`
  const others = presenceUsers.filter((u) => u.userId !== currentUserId)
  return (
    <div
      className="group relative rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md hover:border-foreground/20 transition-all duration-200 cursor-pointer"
      onClick={(e) => {
        if (overlayLocked) return
        const target = e.target as HTMLElement | null
        if (target?.closest?.('[data-no-nav]')) return
        router.push(href)
      }}
    >

      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TaskAssigneeAvatars
            task={task}
            assigneeOptions={assigneeOptions}
            canEdit={canEdit}
            onOptimisticPatch={onOptimisticPatch}
            onOptimisticRollback={onOptimisticRollback}
            className="min-w-0 flex-1"
          />
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {others.length > 0 && <PresenceDot others={others} />}
            {canEdit && statuses.length > 0 && (
              <TaskOptionsMenu
                task={task}
                statuses={statuses}
                taskGroups={taskGroups}
                assigneeOptions={assigneeOptions}
                onOptimisticPatch={onOptimisticPatch ?? (() => {})}
                onOptimisticRollback={onOptimisticRollback ?? (() => {})}
              />
            )}
          </div>
        </div>

        {task.group && groupColor ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${groupColor}`} />
            <span className="text-xs text-muted-foreground truncate">{task.group.title}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Ikke organisert</span>
        )}
      </div>

      <p className="relative z-10 text-sm font-medium leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2 cursor-pointer">
          {task.title}
      </p>
      {task.description && (
        <p className="relative z-10 text-xs text-muted-foreground line-clamp-2 cursor-pointer">
          {stripHtml(task.description)}
        </p>
      )}
      <div className="relative z-10 flex items-center justify-between mt-auto cursor-pointer">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3" />
          {formatTaskScheduleLabel(task.startAt, task.endAt)}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <MessageCircle className="size-3" />
          {task.commentCount ?? task.comments?.length ?? 0}
        </div>
      </div>
    </div>
  )
}