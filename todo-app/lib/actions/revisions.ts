'use server'

import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizationMembers, taskRevisions, tasks } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

function isMissingRevisionsTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const anyErr = err as any
  const code = anyErr.code ?? anyErr.cause?.code
  if (code === '42P01') return true
  const msg = String(anyErr.message ?? anyErr.cause?.message ?? '')
  return msg.includes('relation "task_revisions" does not exist')
}

async function requireCanEditTask(userId: string, taskId: number) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    columns: { id: true, orgId: true, createdBy: true, slug: true },
  })
  if (!task) throw new Error('Task not found')

  if (!task.orgId) {
    if (task.createdBy !== userId) throw new Error('Unauthorized')
    return { task, orgId: null as number | null }
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.orgId, task.orgId), eq(organizationMembers.userId, userId)),
    columns: { role: true },
  })
  if (!membership || membership.role === 'viewer') throw new Error('Unauthorized')

  return { task, orgId: task.orgId }
}

export async function getTaskRevisions(taskId: number) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' as const }

  try {
    await requireCanEditTask(session.user.id, taskId)

    let rows: any[] = []
    try {
      rows = await db.query.taskRevisions.findMany({
        where: eq(taskRevisions.taskId, taskId),
        with: { user: { columns: { displayName: true, email: true, avatarUrl: true } } },
        orderBy: (r, { desc }) => [desc(r.id)],
        limit: 50,
      })
    } catch (e) {
      if (isMissingRevisionsTableError(e)) return { error: 'Missing migration: task_revisions' as const }
      throw e
    }

    return { success: true as const, revisions: rows }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' as const }
  }
}

export async function rollbackTaskToRevision(taskId: number, revisionId: number) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' as const }

  try {
    const { task } = await requireCanEditTask(session.user.id, taskId)

    const rev = await db.query.taskRevisions.findFirst({
      where: and(eq(taskRevisions.id, revisionId), eq(taskRevisions.taskId, taskId)),
    })
    if (!rev) return { error: 'Revision not found' as const }

    const current = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        title: true,
        description: true,
        deadline: true,
        statusId: true,
        groupId: true,
        assigneeId: true,
        order: true,
        updatedAt: true,
        orgId: true,
      },
    })
    if (!current) return { error: 'Task not found' as const }

    const target = rev.before as any

    const [updated] = await db.update(tasks)
      .set({
        title: target.title ?? current.title,
        description: target.description ?? current.description,
        deadline: target.deadline ?? current.deadline,
        statusId: target.statusId ?? current.statusId,
        groupId: target.groupId ?? current.groupId,
        assigneeId: target.assigneeId ?? current.assigneeId,
        order: target.order ?? current.order,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning()

    try {
      await db.insert(taskRevisions).values({
        orgId: updated.orgId ?? null,
        taskId,
        userId: session.user.id,
        action: 'rollback',
        before: current as any,
        after: {
          title: updated.title,
          description: updated.description,
          deadline: updated.deadline,
          statusId: updated.statusId,
          groupId: updated.groupId,
          assigneeId: updated.assigneeId,
          order: updated.order,
          updatedAt: updated.updatedAt,
          orgId: updated.orgId,
        } as any,
      })
    } catch (e) {
      if (!isMissingRevisionsTableError(e)) throw e
    }

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${task.slug}`)
    return { success: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' as const }
  }
}

