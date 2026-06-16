import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { TasksWidget } from '@/components/Dashboard/TasksWidget'
import { OrgsWidget } from '@/components/Dashboard/OrgsWidget'
import { PlaceholderWidget } from '@/components/Dashboard/PlaceholderWidget'
import { NotebookPen, Calendar } from 'lucide-react'
import { db } from '@/lib/db'
import { organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getTasksForUser,
  getTaskGroupsForUser,
  getStatusesForUser,
} from '@/lib/db/queries'

export const metadata: Metadata = {
  title: "På'n – Få fart på oppgavelisten din",
  description: 'Planlegg og fullfør oppgaver effektivt med På\'n.',
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const userId = session.user.id

  const [tasks, taskGroups, statuses, memberships] = await Promise.all([
    getTasksForUser(userId),
    getTaskGroupsForUser(userId),
    getStatusesForUser(userId),
    db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, userId),
      with: {
        org: {
          with: {
            members: true,
            tasks: true,
          },
        },
      },
    }),
  ])

  const orgs = memberships.map((m) => ({
    id:           m.org.id,
    name:         m.org.name,
    slug:         m.org.slug,
    role:         m.role,
    taskCount:    m.org.tasks.length,
    memberCount:  m.org.members.length,
  }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-medium font-heading text-heading-strong">
            Welcome back!
          </h1>
          <p className="text-muted-foreground mt-4">Here&apos;s an overview of what&apos;s happening.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
          <TasksWidget tasks={tasks} taskGroups={taskGroups} statuses={statuses} />
          <OrgsWidget orgs={orgs} />
          <PlaceholderWidget
            title="Notes"
            icon={NotebookPen}
            description="Write and organize notes, ideas, and thoughts in one place."
          />
          <PlaceholderWidget
            title="Calendar"
            icon={Calendar}
            description="Get an overview of upcoming deadlines and events."
            className="md:col-span-2 xl:col-span-1"
          />
        </div>
      </div>
    </div>
  )
}
