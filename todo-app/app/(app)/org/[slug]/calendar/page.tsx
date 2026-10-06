import { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'

import { OrgCalendarClient } from '@/components/Calendar/OrgCalendarClient'
import { SetBreadcrumbLabel } from '@/components/Breadcrumbs/SetBreadcrumbLabel'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { getOrgListForUser, getTaskGroupsForOrg, getTasksForOrg } from '@/lib/db/queries'
import { canEditOrgContent } from '@/lib/orgPermissions'
import { taskHasCalendarDate } from '@/lib/taskCalendar'

export const metadata: Metadata = { title: "Kalender | På'n" }
export const dynamic = 'force-dynamic'

type CalendarPageProps = {
  params: Promise<{ slug: string }>
}

export default async function OrgCalendarPage({ params }: CalendarPageProps) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const userId = session.user.id
  const { slug } = await params

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

  const [orgs, tasks, taskGroups] = await Promise.all([
    getOrgListForUser(userId),
    getTasksForOrg(org.id, { includeCommentCounts: false }),
    getTaskGroupsForOrg(org.id),
  ])

  const calendarTasks = tasks.filter(taskHasCalendarDate)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SetBreadcrumbLabel segment={slug} label={org.name} />
      <Suspense fallback={null}>
        <OrgCalendarClient
          org={{ id: org.id, name: org.name, slug: org.slug }}
          orgs={orgs}
          tasks={calendarTasks}
          taskGroups={taskGroups}
          userId={userId}
          canEdit={canEdit}
        />
      </Suspense>
    </div>
  )
}
