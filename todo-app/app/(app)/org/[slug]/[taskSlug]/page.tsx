import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, organizationMembers, tasks, taskGroups, users } from '@/lib/db/schema'
import { getOrgAssigneeOptions, getStatusesForOrg } from '@/lib/db/queries'
import { normalizeTaskAssignees, TASK_WITH_ASSIGNEES } from '@/lib/taskAssignees'
import { and, eq } from 'drizzle-orm'
import TaskDetails from '@/components/TaskDetails/TaskDetails'
import { SetBreadcrumbLabel } from '@/components/Breadcrumbs/SetBreadcrumbLabel'
import { canEditOrgContent } from '@/lib/orgPermissions'
export const dynamic = 'force-dynamic'

export default async function OrgTaskPage({
  params,
}: {
  params: Promise<{ slug: string; taskSlug: string }>
}) {
  const { slug, taskSlug } = await params

  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  })
  if (!org) redirect('/tasks')

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, session.user.id)
    ),
  })
  if (!membership) redirect('/tasks')

  const canEdit = canEditOrgContent(membership.role)

  const taskRow = await db.query.tasks.findFirst({
    where: and(eq(tasks.slug, taskSlug), eq(tasks.orgId, org.id)),
    with: {
      ...TASK_WITH_ASSIGNEES,
      comments: { with: { user: true } },
    },
  })
  if (!taskRow) redirect(`/org/${slug}`)
  const task = normalizeTaskAssignees(taskRow)

  const groups = await db.query.taskGroups.findMany({
    where: eq(taskGroups.orgId, org.id),
    with: { tasks: true },
  })

  const taskGroupOptions = groups.map((g) => ({
    value: String(g.id),
    label: g.title,
    color: g.color,
  }))

  const taskGroup = task.group?.title

  const [statuses, currentUser, assigneeOptions] = await Promise.all([
    getStatusesForOrg(org.id),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    }),
    getOrgAssigneeOptions(org.id),
  ])

  const statusOptions = statuses.map((s) => ({
    value: String(s.id),
    label: s.label,
    color: s.color,
  }))


  return (
    <>
      <SetBreadcrumbLabel segment={slug} label={org.name} />
      <SetBreadcrumbLabel segment={taskSlug} label={task.title} />
      <TaskDetails
        task={task}
        taskGroup={taskGroup}
        taskGroupOptions={taskGroupOptions}
        statusOptions={statusOptions}
        statuses={statuses}
        assigneeOptions={assigneeOptions}
        currentUserId={session.user.id}
        currentUser={currentUser}
        boardHref={`/org/${slug}`}
        canEdit={canEdit}
      />
    </>
  )
}