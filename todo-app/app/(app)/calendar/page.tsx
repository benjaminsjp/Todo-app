import { Metadata } from 'next'
import { addWeeks, subWeeks } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { redirect } from 'next/navigation'

import { CalendarControls } from '@/components/Calendar/CalendarControls'
import { TaskMonthCalendar } from '@/components/Calendar/TaskMonthCalendar'
import { TaskWeekCalendar } from '@/components/Calendar/TaskWeekCalendar'
import { auth } from '@/lib/auth/server'
import { getOrgListForUser, getTaskGroupsForOrg, getTasksForOrg } from '@/lib/db/queries'
import {
  filterCalendarTasks,
  filterCalendarTasksByGroup,
  formatCalendarWeekParam,
  getAdjacentCalendarMonths,
  getCalendarMonthLabel,
  getCalendarMonthWeeks,
  getCalendarWeekDays,
  getCalendarWeekRangeLabel,
  parseCalendarMonth,
  parseCalendarView,
  parseCalendarWeek,
  type CalendarFilterMode,
} from '@/lib/taskCalendar'

export const metadata: Metadata = { title: "Kalender | På'n" }
export const dynamic = 'force-dynamic'

type CalendarPageProps = {
  searchParams: Promise<{
    org?: string
    filter?: string
    group?: string
    view?: string
    week?: string
    month?: string
  }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const userId = session.user.id
  const [
    { org: orgSlugParam, filter: filterParam, group: groupParam, view: viewParam, week: weekParam, month: monthParam },
    orgs,
  ] = await Promise.all([searchParams, getOrgListForUser(userId)])

  if (orgs.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="container mx-auto flex flex-1 flex-col px-8 py-12">
          <div className="max-w-2xl rounded-2xl border bg-card p-8">
            <h1 className="text-4xl font-medium font-heading text-heading-strong">Kalender</h1>
            <p className="mt-4 text-muted-foreground">
              Du må være medlem av en organisasjon for å bruke kalendervisningen.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const selectedOrg = orgs.find((org) => org.slug === orgSlugParam) ?? orgs[0]
  const filter: CalendarFilterMode = filterParam === 'mine' ? 'mine' : 'org'
  const view = parseCalendarView(viewParam)
  const weekAnchor = parseCalendarWeek(weekParam)
  const monthAnchor = parseCalendarMonth(monthParam ?? weekParam?.slice(0, 7))

  const [tasks, taskGroups] = await Promise.all([
    getTasksForOrg(selectedOrg.id),
    getTaskGroupsForOrg(selectedOrg.id),
  ])

  const validGroupIds = new Set(taskGroups.map((group) => group.id))
  const selectedGroup =
    groupParam === 'none'
      ? 'none'
      : groupParam && groupParam !== 'all' && validGroupIds.has(Number(groupParam))
        ? groupParam
        : 'all'

  const calendarTasks = filterCalendarTasksByGroup(
    filterCalendarTasks(tasks, filter, userId),
    selectedGroup,
  )

  const periodLabel =
    view === 'month'
      ? getCalendarMonthLabel(monthAnchor)
      : getCalendarWeekRangeLabel(weekAnchor)

  const prevPeriod =
    view === 'month'
      ? getAdjacentCalendarMonths(monthAnchor).prev
      : formatCalendarWeekParam(subWeeks(weekAnchor, 1))

  const nextPeriod =
    view === 'month'
      ? getAdjacentCalendarMonths(monthAnchor).next
      : formatCalendarWeekParam(addWeeks(weekAnchor, 1))

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
            {selectedOrg.name} · {periodLabel}
          </p>
        </div>

        <div className="shrink-0">
          <CalendarControls
            orgs={orgs}
            taskGroups={taskGroups}
            selectedOrgSlug={selectedOrg.slug}
            filter={filter}
            selectedGroup={selectedGroup}
            view={view}
            prevPeriod={prevPeriod}
            nextPeriod={nextPeriod}
          />
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {view === 'month' ? (
            <TaskMonthCalendar
              monthAnchor={monthAnchor}
              weeks={getCalendarMonthWeeks(monthAnchor)}
              tasks={calendarTasks}
              orgSlug={selectedOrg.slug}
            />
          ) : (
            <TaskWeekCalendar
              days={getCalendarWeekDays(weekAnchor)}
              tasks={calendarTasks}
              orgSlug={selectedOrg.slug}
            />
          )}
        </div>
      </div>
    </div>
  )
}
