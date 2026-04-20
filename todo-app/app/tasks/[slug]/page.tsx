import { auth } from '@/lib/auth/server'
import { redirect, notFound } from 'next/navigation'
import { getTaskBySlug, getTaskGroupOptions, getStatusesForUser } from '@/lib/db/queries'
import TaskDetails from '@/components/TaskDetails/TaskDetails'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const [task, taskGroupOptions] = await Promise.all([
    getTaskBySlug(slug, session.user.id),
    getTaskGroupOptions(session.user.id, null),
  ])

  if (!task) notFound()

  const statuses = await getStatusesForUser(session.user.id)


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
    />
  )
}