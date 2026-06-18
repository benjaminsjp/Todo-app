import 'server-only'
import { db } from '@/lib/db'
import { tasks, taskGroups, statuses, organizationMembers, invitations } from '@/lib/db/schema'
import { eq, or, isNull, and, gt } from 'drizzle-orm'

export async function getTasksForUser(userId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.createdBy, userId), isNull(tasks.orgId)),
    with: { group: true, status: true, comments: { with: { user: true } } },
    orderBy: (tasks, { asc }) => [asc(tasks.order)], 
  })
}

export async function getTaskGroupsForUser(userId: string) {
  return db.query.taskGroups.findMany({
    where: and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)),
    with: { tasks: { with: { status: true } } },
  })
}

export async function getTaskBySlug(slug: string, userId: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.slug, slug),
    with: {
      group:    true,
      status:   true,
      comments: { with: { user: true } },
    },
  })
}

export async function getTaskGroupOptions(userId: string, orgId?: number | null) {
  const groups = await db.query.taskGroups.findMany({
    where: orgId
      ? eq(taskGroups.orgId, orgId)
      : and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)),
  })
  return groups.map((g) => ({
    value: String(g.id),
    label: g.title,
    color: g.color,
  }))
}

export async function getTasksForOrg(orgId: number) {
  return db.query.tasks.findMany({
    where: eq(tasks.orgId, orgId),
    with: {
      group:    true,
      status:   true,
      comments: { with: { user: true } },
    },
    orderBy: (tasks, { asc }) => [asc(tasks.order)],
  })
}

export async function getTaskGroupsForOrg(orgId: number) {
  return db.query.taskGroups.findMany({
    where: eq(taskGroups.orgId, orgId),
    with: { tasks: true },
  })
}

export async function getStatusesForUser(userId: string) {
  return db.query.statuses.findMany({
    where: eq(statuses.userId, userId),
    orderBy: (s, { asc }) => [asc(s.order)],
  })
}

export async function getStatusesForOrg(orgId: number) {
  return db.query.statuses.findMany({
    where: eq(statuses.orgId, orgId),
    orderBy: (s, { asc }) => [asc(s.order)],
  })
}


export async function getPersonalTasksForSidebar(userId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.createdBy, userId), isNull(tasks.orgId)),
    with: { group: true, status: true },
    orderBy: (tasks, { asc }) => [asc(tasks.order)],
  })
}

export async function getPersonalGroupsForSidebar(userId: string) {
  return db.query.taskGroups.findMany({
    where: and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)),
    with: { tasks: { with: { status: true } } },
  })
}

export async function getPendingInvitationsForEmail(email: string) {
  return db.query.invitations.findMany({
    where: and(
      eq(invitations.email, email.toLowerCase()),
      gt(invitations.expiresAt, new Date()),
    ),
    with: { org: true },
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  })
}

export async function getOrgsForSidebar(userId: string) {
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    with: { org: true },
  })

  return Promise.all(
    memberships.map(async (m) => {
      const [orgTasks, orgGroups, orgStatuses] = await Promise.all([
        db.query.tasks.findMany({
          where: eq(tasks.orgId, m.org.id),
          with: { group: true, status: true },
          orderBy: (tasks, { asc }) => [asc(tasks.order)],
        }),
        db.query.taskGroups.findMany({
          where: eq(taskGroups.orgId, m.org.id),
          with: { tasks: { with: { status: true } } },
        }),
        getStatusesForOrg(m.org.id),
      ])

      return {
        id:       m.org.id,
        name:     m.org.name,
        slug:     m.org.slug,
        tasks:    orgTasks,
        groups:   orgGroups,
        statuses: orgStatuses,
      }
    })
  )
}
