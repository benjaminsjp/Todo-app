import 'server-only'
import { db } from '@/lib/db'
import { tasks, taskGroups, statuses } from '@/lib/db/schema'
import { eq, or, isNull, and } from 'drizzle-orm'

export async function getTasksForUser(userId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.createdBy, userId), isNull(tasks.orgId)),
    with: { group: true, status: true, comments: true },
    orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
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
      comments: true,
    },
    orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
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
