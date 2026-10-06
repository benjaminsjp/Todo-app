'use client'

import { useMemo } from 'react'
import { addWeeks, subWeeks } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { CalendarControls } from '@/components/Calendar/CalendarControls'
import { TaskMonthCalendar } from '@/components/Calendar/TaskMonthCalendar'
import { TaskWeekCalendar } from '@/components/Calendar/TaskWeekCalendar'
import {
  filterCalendarTasks,
  filterCalendarTasksByGroup,
  filterTasksOverlappingRange,
  formatCalendarWeekParam,
  getAdjacentCalendarMonths,
  getCalendarMonthLabel,
  getCalendarMonthWeeks,
  getCalendarWeekDays,
  getCalendarWeekRangeLabel,
  parseCalendarMonth,
  parseCalendarView,
  parseCalendarWeek,
  taskHasCalendarDate,
  type CalendarFilterMode,
  type CalendarViewMode,
} from '@/lib/taskCalendar'
import type { Task, TaskGroup } from '@/lib/types'

type OrgOption = {
  id: number
  name: string
  slug: string
}

type OrgCalendarClientProps = {
  org: { id: number; name: string; slug: string }
  orgs: OrgOption[]
  tasks: Task[]
  taskGroups: TaskGroup[]
  userId: string
  canEdit: boolean
}

function resolveGroupParam(
  groupParam: string | null,
  taskGroups: TaskGroup[],
): string {
  if (groupParam === 'none') return 'none'
  if (
    groupParam &&
    groupParam !== 'all' &&
    taskGroups.some((group) => String(group.id) === groupParam)
  ) {
    return groupParam
  }
  return 'all'
}

export function OrgCalendarClient({
  org,
  orgs,
  tasks,
  taskGroups,
  userId,
  canEdit,
}: OrgCalendarClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filter: CalendarFilterMode =
    searchParams.get('filter') === 'mine' ? 'mine' : 'org'
  const view = parseCalendarView(searchParams.get('view') ?? undefined)
  const selectedGroup = resolveGroupParam(searchParams.get('group'), taskGroups)
  const weekParam = searchParams.get('week') ?? undefined
  const monthParam = searchParams.get('month') ?? undefined
  const weekAnchor = useMemo(() => parseCalendarWeek(weekParam), [weekParam])
  const monthAnchor = useMemo(
    () => parseCalendarMonth(monthParam ?? weekParam?.slice(0, 7)),
    [monthParam, weekParam],
  )

  const calendarTasks = useMemo(() => {
    const dated = tasks.filter(taskHasCalendarDate)
    return filterCalendarTasksByGroup(
      filterCalendarTasks(dated, filter, userId),
      selectedGroup,
    )
  }, [tasks, filter, userId, selectedGroup])

  const weeks = useMemo(
    () => getCalendarMonthWeeks(monthAnchor),
    [monthAnchor],
  )
  const weekDays = useMemo(
    () => getCalendarWeekDays(weekAnchor),
    [weekAnchor],
  )

  const visibleTasks = useMemo(() => {
    if (view === 'month') {
      const firstDay = weeks[0]?.days[0]
      const lastWeek = weeks[weeks.length - 1]
      const lastDay = lastWeek?.days[lastWeek.days.length - 1]
      if (!firstDay || !lastDay) return calendarTasks
      return filterTasksOverlappingRange(calendarTasks, firstDay, lastDay)
    }
    return filterTasksOverlappingRange(
      calendarTasks,
      weekDays[0]!,
      weekDays[weekDays.length - 1]!,
    )
  }, [view, calendarTasks, weeks, weekDays])

  const periodLabel =
    view === 'month'
      ? getCalendarMonthLabel(monthAnchor)
      : getCalendarWeekRangeLabel(weekAnchor)

  const updateParams = (
    patch: Record<string, string | null>,
    mode: 'push' | 'replace' = 'push',
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === '') params.delete(key)
      else params.set(key, value)
    }
    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname
    if (mode === 'replace') window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
  }

  const handleOrgChange = (nextOrgSlug: string) => {
    if (nextOrgSlug === org.slug) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('org')
    params.delete('group')
    const query = params.toString()
    router.push(`/org/${nextOrgSlug}/calendar${query ? `?${query}` : ''}`)
  }

  const handleViewChange = (nextView: CalendarViewMode) => {
    if (nextView === view) return
    const patch: Record<string, string | null> = { view: nextView }
    if (nextView === 'month' && !searchParams.get('month')) {
      const week = searchParams.get('week')
      if (week) patch.month = week.slice(0, 7)
    }
    updateParams(patch)
  }

  const handlePrevPeriod = () => {
    if (view === 'month') {
      updateParams({ month: getAdjacentCalendarMonths(monthAnchor).prev })
      return
    }
    updateParams({ week: formatCalendarWeekParam(subWeeks(weekAnchor, 1)) })
  }

  const handleNextPeriod = () => {
    if (view === 'month') {
      updateParams({ month: getAdjacentCalendarMonths(monthAnchor).next })
      return
    }
    updateParams({ week: formatCalendarWeekParam(addWeeks(weekAnchor, 1)) })
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[90rem] flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {view === 'month' ? 'Månedsvisning' : 'Ukevisning'}
        </div>
        <h1 className="mt-1 text-3xl font-medium font-heading text-heading-strong sm:text-4xl">
          Kalender
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {org.name} · {periodLabel}
        </p>
      </div>

      <div className="shrink-0">
        <CalendarControls
          orgs={orgs}
          taskGroups={taskGroups}
          selectedOrgSlug={org.slug}
          filter={filter}
          selectedGroup={selectedGroup}
          view={view}
          onOrgChange={handleOrgChange}
          onFilterChange={(next) => updateParams({ filter: next })}
          onGroupChange={(next) =>
            updateParams({ group: next === 'all' ? null : next })
          }
          onViewChange={handleViewChange}
          onPrevPeriod={handlePrevPeriod}
          onNextPeriod={handleNextPeriod}
        />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {view === 'month' ? (
          <TaskMonthCalendar
            monthAnchor={monthAnchor}
            weeks={weeks}
            tasks={visibleTasks}
            orgSlug={org.slug}
            canEdit={canEdit}
          />
        ) : (
          <TaskWeekCalendar
            days={weekDays}
            tasks={visibleTasks}
            orgSlug={org.slug}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  )
}
