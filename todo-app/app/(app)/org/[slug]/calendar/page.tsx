import { Metadata } from 'next'
import { addWeeks, subWeeks } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'

import { CalendarControls } from '@/components/Calendar/CalendarControls'
import { TaskMonthCalendar } from '@/components/Calendar/TaskMonthCalendar'
import { TaskWeekCalendar } from '@/components/Calendar/TaskWeekCalendar'
import { SetBreadcrumbLabel } from '@/components/Breadcrumbs/SetBreadcrumbLabel'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { getOrgListForUser, getTaskGroupsForOrg, getTasksForOrg } from '@/lib/db/queries'
import { canEditOrgContent } from '@/lib/orgPermissions'
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
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    filter?: string
    group?: string
    view?: string
    week?: string
    month?: string
  }>
}

export default async function OrgCalendarPage({ params, searchParams }: CalendarPageProps) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const userId = session.user.id
  const { slug } = await params
  const { filter: filterParam, group: groupParam, view: viewParam, week: weekParam, month: monthParam } =
    await searchParams

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  })
  if (!org) redirect('/org')

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, userId),
    ),
  })
  if (!membership) redirect('/org')

  const canEdit = canEditOrgContent(membership.role)
  const orgs = await getOrgListForUser(userId)

  const filter: CalendarFilterMode = filterParam === 'mine' ? 'mine' : 'org'
  const view = parseCalendarView(viewParam)
  const weekAnchor = parseCalendarWeek(weekParam)
  const monthAnchor = parseCalendarMonth(monthParam ?? weekParam?.slice(0, 7))

  const [tasks, taskGroups] = await Promise.all([
    getTasksForOrg(org.id),
    getTaskGroupsForOrg(org.id),
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
      <SetBreadcrumbLabel segment={slug} label={org.name} />
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
              orgSlug={org.slug}
              canEdit={canEdit}
            />
          ) : (
            <TaskWeekCalendar
              days={getCalendarWeekDays(weekAnchor)}
              tasks={calendarTasks}
              orgSlug={org.slug}
              canEdit={canEdit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
