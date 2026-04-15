// app/org/[slug]/[taskSlug]/page.tsx
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { tasks, taskGroups } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import TaskDetails from '@/components/TaskDetails/TaskDetails'
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

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.slug, taskSlug), eq(tasks.orgId, org.id)),
    with: {
      group:    true,
      status:   true,
      comments: { with: { user: true } },
    },
  })
  if (!task) redirect(`/org/${slug}`)

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

  return (
    <TaskDetails
      task={task}
      taskGroup={taskGroup}
      taskGroupOptions={taskGroupOptions}
    />
  )
}