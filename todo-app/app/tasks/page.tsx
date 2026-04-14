import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getTasksForUser, getTaskGroupsForUser } from '@/lib/db/queries'
import { KanbanBoard } from '@/components/Kanban/KanbanBoard'
import { CreateTaskButton } from '@/components/Kanban/CreateTaskButton'

export const metadata: Metadata = { title: "Tasks | På'n" }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const [tasks, taskGroups] = await Promise.all([
    getTasksForUser(session.user.id),
    getTaskGroupsForUser(session.user.id),
  ])

  console.log('første task:', JSON.stringify(tasks[0], null, 2))

  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-medium font-heading text-heading-strong">Tasks</h1>
          <CreateTaskButton />
        </div>
        <KanbanBoard tasks={tasks} taskGroups={taskGroups} />
      </div>

      
    </div>
    
  )
}