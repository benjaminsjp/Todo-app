import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { TasksWidget } from '@/components/Dashboard/TasksWidget'
import { OrgsWidget } from '@/components/Dashboard/OrgsWidget'
import { CalendarWidget } from '@/components/Dashboard/CalendarWidget'
import {
  getTasksForUser,
  getTaskGroupsForUser,
  getStatusesForUser,
  getOrgPreviewsForUser,
  getUpcomingDeadlineTasksForUser,
} from '@/lib/db/queries'

export const metadata: Metadata = {
  title: "På'n – Få fart på oppgavelisten din",
  description: 'Planlegg og fullfør oppgaver effektivt med På\'n.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const userId = session.user.id

  const [tasks, taskGroups, statuses, orgs, upcoming] = await Promise.all([
    getTasksForUser(userId),
    getTaskGroupsForUser(userId),
    getStatusesForUser(userId),
    getOrgPreviewsForUser(userId),
    getUpcomingDeadlineTasksForUser(userId, 5),
  ])

  const calendarHref = orgs[0] ? `/org/${orgs[0].slug}/calendar` : undefined

  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-medium font-heading text-heading-strong">
            Velkommen tilbake!
          </h1>
          <p className="text-muted-foreground mt-4">Her er en oversikt over det som skjer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
          <TasksWidget tasks={tasks} taskGroups={taskGroups} statuses={statuses} />
          <OrgsWidget orgs={orgs} />
          <CalendarWidget tasks={upcoming} calendarHref={calendarHref} userId={userId} />
        </div>
      </div>
    </div>
  )
}
