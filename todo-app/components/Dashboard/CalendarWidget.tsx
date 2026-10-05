'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, CalendarClock, Check, EyeOff, Pin } from 'lucide-react'
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import { toast } from 'sonner'

import { DashboardWidget } from './DashboardWidget'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateTask } from '@/lib/actions/tasks'
import {
  getHiddenDeadlineTaskIds,
  hideDeadlineTaskId,
} from '@/lib/hiddenDeadlineTasks'
import { formatTaskScheduleLabel } from '@/lib/taskSchedule'
import { resolveStatusIcon } from '@/lib/statusIcons'
import { cn } from '@/lib/utils'

export type UpcomingDeadlineTask = {
  id:      number
  title:   string
  slug:    string
  endAt:   Date
  orgSlug: string | null
  orgName: string | null
  canEdit: boolean
  deadlinePriority: boolean
  status:  { label: string; color: string; icon?: string | null } | null
}

type AnimatedTask = UpcomingDeadlineTask & {
  phase: 'enter' | 'idle' | 'exit'
}

const VISIBLE_LIMIT = 5

function taskHref(task: UpcomingDeadlineTask) {
  if (task.orgSlug) return `/org/${task.orgSlug}/${task.slug}`
  return `/tasks/${task.slug}`
}

function urgencyClass(endAt: Date): string {
  const days = differenceInCalendarDays(startOfDay(endAt), startOfDay(new Date()))
  if (days < 0) return 'text-destructive'
  if (days === 0) return 'text-orange-600 dark:text-orange-400'
  if (days <= 2) return 'text-amber-700 dark:text-amber-400'
  return 'text-muted-foreground'
}

function toAnimated(tasks: UpcomingDeadlineTask[], phase: AnimatedTask['phase']): AnimatedTask[] {
  return tasks.map((task) => ({ ...task, phase }))
}

function pickVisible(
  candidates: UpcomingDeadlineTask[],
  hiddenIds: Set<number>,
): UpcomingDeadlineTask[] {
  return candidates.filter((task) => !hiddenIds.has(task.id)).slice(0, VISIBLE_LIMIT)
}

export function CalendarWidget({
  tasks: candidates,
  calendarHref,
  userId,
}: {
  tasks: UpcomingDeadlineTask[]
  calendarHref?: string
  userId: string
}) {
  const router = useRouter()
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(() => new Set())
  const [hydrated, setHydrated] = useState(false)
  const visibleCandidates = useMemo(
    () => (hydrated ? pickVisible(candidates, hiddenIds) : pickVisible(candidates, new Set())),
    [candidates, hiddenIds, hydrated],
  )
  const [items, setItems] = useState<AnimatedTask[]>(() => toAnimated(visibleCandidates, 'idle'))
  const [pendingTask, setPendingTask] = useState<UpcomingDeadlineTask | null>(null)
  const [isPending, startTransition] = useTransition()
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setHiddenIds(new Set(getHiddenDeadlineTaskIds(userId)))
    setHydrated(true)
  }, [userId])

  useEffect(() => {
    if (!hydrated) return

    setItems((prev) => {
      const prevById = new Map(prev.map((item) => [item.id, item]))
      const nextIds = new Set(visibleCandidates.map((task) => task.id))
      const reduced = prefersReducedMotion.current

      const nextItems: AnimatedTask[] = visibleCandidates.map((task) => {
        const existing = prevById.get(task.id)
        if (!existing || existing.phase === 'exit') {
          return { ...task, phase: reduced ? 'idle' : 'enter' }
        }
        return {
          ...task,
          phase: existing.phase === 'enter' ? 'enter' : 'idle',
        }
      })

      for (const item of prev) {
        if (nextIds.has(item.id)) continue
        if (item.phase === 'exit') {
          nextItems.push(item)
        } else if (!reduced) {
          nextItems.push({ ...item, phase: 'exit' })
        }
      }

      return nextItems
    })
  }, [visibleCandidates, hydrated])

  const removeItem = (taskId: number) => {
    if (prefersReducedMotion.current) {
      setItems((prev) => prev.filter((item) => item.id !== taskId))
      return
    }

    setItems((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, phase: 'exit' } : item)),
    )
  }

  const handleExitEnd = (taskId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== taskId))
  }

  const handleEnterEnd = (taskId: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === taskId && item.phase === 'enter' ? { ...item, phase: 'idle' } : item)),
    )
  }

  const handleConfirm = () => {
    if (!pendingTask) return
    const task = pendingTask

    if (!task.canEdit) {
      hideDeadlineTaskId(userId, task.id)
      setHiddenIds((prev) => new Set([...prev, task.id]))
      setPendingTask(null)
      removeItem(task.id)
      toast.success('Fristen er skjult for deg')
      return
    }

    startTransition(async () => {
      const result = await updateTask(task.id, { endAt: null })
      if ('error' in result) {
        toast.error(result.error)
        return
      }

      setPendingTask(null)
      removeItem(task.id)
      toast.success('Fristen ble fjernet')
      router.refresh()
    })
  }

  const visibleItems = items
  const showListEmpty = visibleItems.length === 0

  return (
    <>
      <DashboardWidget
        title="Kalender"
        href={calendarHref}
        icon={Calendar}
        iconColor="text-emerald-600 dark:text-emerald-400"
      >
        {showListEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <CalendarClock className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Ingen kommende frister på oppgavene dine.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {visibleItems.map((task) => {
              const { Icon, className: statusClass } = resolveStatusIcon(
                task.status?.icon,
                task.status?.color ?? 'gray',
              )
              return (
                <li
                  key={task.id}
                  className={cn(
                    'rounded-lg hover:bg-accent/60 transition-colors',
                    task.phase === 'enter' && 'calendar-deadline-enter',
                    task.phase === 'exit' && 'calendar-deadline-exit',
                  )}
                  onAnimationEnd={() => {
                    if (task.phase === 'exit') handleExitEnd(task.id)
                    if (task.phase === 'enter') handleEnterEnd(task.id)
                  }}
                >
                  <div className="flex items-start gap-3 px-3 pt-2.5 pb-1.5">
                    <Link href={taskHref(task)} className="flex items-start gap-3 min-w-0 flex-1">
                      <Icon className={cn('size-4 mt-0.5 shrink-0', statusClass)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate flex items-center gap-1.5">
                          {task.deadlinePriority && (
                            <Pin className="size-3.5 shrink-0 text-foreground fill-current" aria-label="Prioritet" />
                          )}
                          <span className="truncate">{task.title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {task.orgName ?? 'Personlig'}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium shrink-0 tabular-nums text-right',
                          urgencyClass(new Date(task.endAt)),
                        )}
                      >
                        {formatTaskScheduleLabel(undefined, task.endAt)}
                      </span>
                    </Link>
                  </div>
                  <div className="px-3 pb-2 pl-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      disabled={task.phase === 'exit'}
                      onClick={() => setPendingTask(task)}
                    >
                      {task.canEdit ? (
                        <>
                          <Check className="size-3.5" />
                          Marker som fullført
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3.5" />
                          Skjul
                        </>
                      )}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </DashboardWidget>

      <Dialog
        open={pendingTask !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingTask(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pendingTask?.canEdit ? 'Fjerne frist?' : 'Skjule frist?'}
            </DialogTitle>
            <DialogDescription>
              {pendingTask?.canEdit ? (
                <>
                  Er du sikker på at du vil fjerne fristen for «{pendingTask?.title}»?
                  Oppgaven forsvinner da fra listen over kommende frister.
                </>
              ) : (
                <>
                  Skjul «{pendingTask?.title}» fra oversikten din? Fristen på oppgaven
                  endres ikke — den skjules bare for deg.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingTask(null)}
              disabled={isPending}
            >
              Avbryt
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {pendingTask?.canEdit
                ? isPending
                  ? 'Fjerner…'
                  : 'Ja, fjern frist'
                : 'Ja, skjul'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
