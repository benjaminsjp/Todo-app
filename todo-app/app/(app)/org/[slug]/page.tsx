// app/org/[slug]/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getTasksForOrg, getTaskGroupsForOrg, getStatusesForOrg, getOrgAssigneeOptions } from '@/lib/db/queries'
import { KanbanBoard } from '@/components/Kanban/KanbanBoard'
import { BoardPageSkeleton } from '@/components/Kanban/BoardPageSkeleton'
import { CreateTaskButton } from '@/components/CreateTask/CreateTaskButton'
import { SetBreadcrumbLabel } from '@/components/Breadcrumbs/SetBreadcrumbLabel'
import { canEditOrgContent } from '@/lib/orgPermissions'
import { CalendarDays, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: "Organisasjon | På'n" }
export const dynamic = 'force-dynamic'

export default function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<BoardPageSkeleton />}>
      <OrgBoardContent params={params} />
    </Suspense>
  )
}

async function OrgBoardContent({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: { id: true, name: true, slug: true },
  })
  if (!org) redirect('/tasks')

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, session.user.id),
    ),
    columns: { role: true },
  })
  if (!membership) redirect('/tasks')

  const canEdit = canEditOrgContent(membership.role)

  const [tasks, taskGroups, statuses, assigneeOptions] = await Promise.all([
    getTasksForOrg(org.id),
    getTaskGroupsForOrg(org.id),
    getStatusesForOrg(org.id),
    getOrgAssigneeOptions(org.id),
  ])

  return (
    <div className="flex flex-1 flex-col">
      <SetBreadcrumbLabel segment={slug} label={org.name} />
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
        <div className="mb-6 gap-4 flex items-center">
          {canEdit && <CreateTaskButton orgId={org.id} />}
          <Button variant="secondary" asChild>
            <Link href={`/org/${org.slug}/calendar`} prefetch>
              <CalendarDays className="size-4" />
              Kalender
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/org/${org.slug}/settings`} prefetch>
              <Settings className="size-4" />
              {['owner', 'admin'].includes(membership.role)
                ? 'Administrer organisasjon'
                : 'Organisasjonsinnstillinger'}
            </Link>
          </Button>
        </div>
        <div className="flex items-center mb-8 gap-3">
          <h1 className="text-5xl font-medium font-heading text-heading-strong">
            {org.name}
          </h1>
        </div>
        <KanbanBoard
          tasks={tasks}
          taskGroups={taskGroups}
          statuses={statuses}
          assigneeOptions={assigneeOptions}
          orgSlug={org.slug}
          orgId={org.id}
          userId={session.user.id}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
