import { auth } from '@/lib/auth/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { tasks, taskGroups } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TaskDetails from '@/components/TaskDetails/TaskDetails'
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.slug, slug),
    with: {
      group:    true,
      status:   true,
      comments: {
        with: { user: true },
      },
    },
  })

  if (!task) notFound()

  const allTaskGroups = await db.query.taskGroups.findMany({
    where: eq(taskGroups.createdBy, session.user.id),
  })

  const taskGroupOptions = allTaskGroups.map((g) => ({
    value: String(g.id),
    label: g.title,
    color: g.color,
  }))

  return (
    <TaskDetails
      task={task}
      taskGroup={task.group?.title}
      taskGroupOptions={taskGroupOptions}
    />
  )
}