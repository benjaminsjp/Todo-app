import { auth } from '@/lib/auth/server'
import { redirect, notFound } from 'next/navigation'
import { getTaskBySlug, getTaskGroupOptions, getStatusesForUser } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TaskDetails from '@/components/TaskDetails/TaskDetails'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const [task, taskGroupOptions, statuses] = await Promise.all([
    getTaskBySlug(slug, session.user.id),
    getTaskGroupOptions(session.user.id, null),
    getStatusesForUser(session.user.id),
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
    <TaskDetails
      task={task}
      taskGroup={task.group?.title}
      taskGroupOptions={taskGroupOptions}
      statusOptions={statusOptions}
      statuses={statuses}
      currentUserId={session.user.id}
      currentUser={currentUser}
      boardHref="/tasks"
    />
  )
}