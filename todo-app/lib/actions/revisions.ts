'use server'

import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizationMembers, taskAssignees, taskRevisions, tasks } from '@/lib/db/schema'
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
  if (!task) throw new Error('Oppgave ikke funnet')

  if (!task.orgId) {
    if (task.createdBy !== userId) throw new Error('Ingen tilgang')
    return { task, orgId: null as number | null }
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.orgId, task.orgId), eq(organizationMembers.userId, userId)),
    columns: { role: true },
  })
  if (!membership || membership.role === 'viewer') throw new Error('Ingen tilgang')

  return { task, orgId: task.orgId }
}

export async function getTaskRevisions(taskId: number) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' as const }

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
      if (isMissingRevisionsTableError(e)) return { error: 'Mangler migrering: task_revisions' as const }
      throw e
    }

    return { success: true as const, revisions: rows }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' as const }
  }
}

export async function rollbackTaskToRevision(taskId: number, revisionId: number) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' as const }

  try {
    const { task } = await requireCanEditTask(session.user.id, taskId)

    const rev = await db.query.taskRevisions.findFirst({
      where: and(eq(taskRevisions.id, revisionId), eq(taskRevisions.taskId, taskId)),
    })
    if (!rev) return { error: 'Revisjon ikke funnet' as const }

    const current = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        title: true,
        description: true,
        startAt: true,
        endAt:   true,
        statusId: true,
        groupId: true,
        order: true,
        updatedAt: true,
        orgId: true,
      },
    })
    if (!current) return { error: 'Oppgave ikke funnet' as const }

    const currentAssigneeRows = await db.query.taskAssignees.findMany({
      where: eq(taskAssignees.taskId, taskId),
      columns: { userId: true },
    })
    const currentAssigneeIds = currentAssigneeRows.map((row) => row.userId).sort()

    const target = rev.before as any
    const targetAssigneeIds = Array.isArray(target.assigneeIds)
      ? [...target.assigneeIds].sort()
      : target.assigneeId
        ? [target.assigneeId]
        : []

    const legacyEndAt =
      target.endAt ??
      (target.deadline
        ? typeof target.deadline === 'string'
          ? new Date(target.deadline.includes('T') ? target.deadline : `${target.deadline}T17:00:00`)
          : null
        : null)

    const [updated] = await db.update(tasks)
      .set({
        title: target.title ?? current.title,
        description: target.description ?? current.description,
        startAt: target.startAt ? new Date(target.startAt) : current.startAt,
        endAt: legacyEndAt ?? current.endAt,
        statusId: target.statusId ?? current.statusId,
        groupId: target.groupId ?? current.groupId,
        order: target.order ?? current.order,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning()

    await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId))
    if (targetAssigneeIds.length > 0) {
      await db.insert(taskAssignees).values(
        targetAssigneeIds.map((userId: string) => ({ taskId, userId })),
      )
    }

    try {
      await db.insert(taskRevisions).values({
        orgId: updated.orgId ?? null,
        taskId,
        userId: session.user.id,
        action: 'rollback',
        before: { ...current, assigneeIds: currentAssigneeIds } as any,
        after: {
          title: updated.title,
          description: updated.description,
          startAt: updated.startAt?.toISOString() ?? null,
          endAt: updated.endAt?.toISOString() ?? null,
          statusId: updated.statusId,
          groupId: updated.groupId,
          assigneeIds: targetAssigneeIds,
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
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' as const }
  }
}
