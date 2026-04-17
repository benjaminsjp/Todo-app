import { auth } from '@/lib/auth/server'
import { redirect, notFound } from 'next/navigation'
import { getTaskBySlug, getTaskGroupOptions } from '@/lib/db/queries'
import TaskDetails from '@/components/TaskDetails/TaskDetails'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const [task, taskGroupOptions] = await Promise.all([
    getTaskBySlug(slug, session.user.id),
    getTaskGroupOptions(session.user.id),
  ])

  if (!task) notFound()

  return (
    <TaskDetails
      task={task}
      taskGroup={task.group?.title}
      taskGroupOptions={taskGroupOptions}
    />
  )
}