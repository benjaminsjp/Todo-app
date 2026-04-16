import 'server-only'
import { db } from '@/lib/db'
import { tasks, taskGroups } from '@/lib/db/schema'
import { eq, or, isNull, and } from 'drizzle-orm'

export async function getTasksForUser(userId: string) {
  return db.query.tasks.findMany({
    where: and(
      eq(tasks.createdBy, userId),
      isNull(tasks.orgId)
    ),
    with: { group: true, status: true, comments: true },
    orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
  })
}

export async function getTaskGroupsForUser(userId: string) {
  return db.query.taskGroups.findMany({
    where: and(
      eq(taskGroups.createdBy, userId),
      isNull(taskGroups.orgId) 
    ),
    with: { tasks: true },
  })
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