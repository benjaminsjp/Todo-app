import 'server-only'

import { db } from '@/lib/db'
import { organizationMembers, tasks } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

/** Throws when the user may not add or change task content (e.g. org viewer). */
export async function assertCanMutateTaskContent(userId: string, taskId: number) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    columns: { id: true, orgId: true, createdBy: true },
  })
  if (!task) throw new Error('Oppgave ikke funnet')

  if (!task.orgId) {
    if (task.createdBy !== userId) throw new Error('Ingen tilgang')
    return
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, task.orgId),
      eq(organizationMembers.userId, userId),
    ),
    columns: { role: true },
  })
  if (!membership || membership.role === 'viewer') throw new Error('Ingen tilgang')
}
