import { auth } from '@/lib/auth/server'
import { redirect, notFound } from 'next/navigation'
import { getPersonalAssigneeOptions, getTaskBySlug, getTaskGroupOptions, getStatusesForUser } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TaskDetails from '@/components/TaskDetails/TaskDetails'
import { SetBreadcrumbLabel } from '@/components/Breadcrumbs/SetBreadcrumbLabel'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const [task, taskGroupOptions, statuses, assigneeOptions] = await Promise.all([
    getTaskBySlug(slug, session.user.id),
    getTaskGroupOptions(session.user.id, null),
    getStatusesForUser(session.user.id),
    getPersonalAssigneeOptions(session.user.id),
  ])

  if (!task) notFound()

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  const statusOptions = statuses.map((s) => ({
    value: String(s.id),
    label: s.label,
    color: s.color,
  }))

  return (
    <>
      <SetBreadcrumbLabel segment={slug} label={task.title} />
      <TaskDetails
        task={task}
        taskGroup={task.group?.title}
        taskGroupOptions={taskGroupOptions}
        statusOptions={statusOptions}
        statuses={statuses}
        assigneeOptions={assigneeOptions}
        currentUserId={session.user.id}
        currentUser={currentUser}
        boardHref="/tasks"
      />
    </>
  )
}