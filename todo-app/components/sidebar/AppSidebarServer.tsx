// components/sidebar/AppSidebarServer.tsx
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizationMembers, taskGroups, tasks } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { AppSidebar } from './AppSidebar'

export async function AppSidebarServer() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return null

  const userId = session.user.id

  // Personal tasks and groups
  const [personalTasks, personalGroups, memberships] = await Promise.all([
    db.query.tasks.findMany({
        where: and(eq(tasks.createdBy, userId), isNull(tasks.orgId)),
        with: { group: true, status: true },
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    }),
    db.query.taskGroups.findMany({
        where: and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)),
        with: { tasks: { with: { status: true } } },
    }),
    db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, userId),
      with: {
        org: true,
      },
    }),
  ])

  // Fetch tasks and groups for each org
  const orgs = await Promise.all(
    memberships.map(async (m) => {
      const [orgTasks, orgGroups] = await Promise.all([
        db.query.tasks.findMany({
          where: eq(tasks.orgId, m.org.id),
          with: { group: true, status: true },
          orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
        }),
        db.query.taskGroups.findMany({
          where: eq(taskGroups.orgId, m.org.id),
          with: { tasks: { with: { status: true } } },
        }),
      ])

      return {
        id:     m.org.id,
        name:   m.org.name,
        slug:   m.org.slug,
        tasks:  orgTasks,
        groups: orgGroups,
      }
    })
  )

  return (
    <AppSidebar
      personalTasks={personalTasks}
      personalGroups={personalGroups}
      orgs={orgs}
    />
  )
}