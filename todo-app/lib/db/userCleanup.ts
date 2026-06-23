import { db } from '@/lib/db'
import { comments, taskAssignees, taskGroups, tasks, users } from '@/lib/db/schema'
import { and, eq, isNull, or } from 'drizzle-orm'
import { resolveOwnedOrganizations } from '@/lib/db/orgOwnership'

export async function cleanupUserData(userId: string) {
  await resolveOwnedOrganizations(userId)

  await db.delete(comments).where(eq(comments.userId, userId))

  await db.delete(taskAssignees).where(eq(taskAssignees.userId, userId))

  await db.delete(tasks).where(
    and(eq(tasks.createdBy, userId), isNull(tasks.orgId))
  )

  await db.delete(taskGroups).where(
    and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId))
  )
}

export async function deleteUserFromDatabase(userId: string) {
  await cleanupUserData(userId)
  await db.delete(users).where(eq(users.id, userId))
}
