// app/tasks/create-task/page.tsx
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { taskGroups } from '@/lib/db/schema'
import { CreateTaskForm } from '@/components/Kanban/CreateTaskForm'
export default async function CreateTaskPage() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/login')

  const groups = await db.select({
    id:    taskGroups.id,
    title: taskGroups.title,
  }).from(taskGroups)

  return (
      <CreateTaskForm taskGroups={groups} />
  )
}