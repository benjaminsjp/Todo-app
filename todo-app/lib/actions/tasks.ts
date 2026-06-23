'use server'

import { db } from '@/lib/db'
import { organizationMembers, taskAssignees, taskPresence, taskRevisions, tasks, statuses, users } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq, and, isNull, gt, ne, asc } from 'drizzle-orm'
import { redirect } from 'next/navigation'

const LOCK_TTL_MS = 15_000

async function requireCanEditTask(userId: string, taskId: number) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    columns: { id: true, orgId: true, createdBy: true },
  })
  if (!task) throw new Error('Oppgave ikke funnet')

  if (!task.orgId) {
    if (task.createdBy !== userId) throw new Error('Ingen tilgang')
    return { orgId: null as number | null }
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.orgId, task.orgId), eq(organizationMembers.userId, userId)),
    columns: { role: true },
  })
  if (!membership || membership.role === 'viewer') throw new Error('Ingen tilgang')

  return { orgId: task.orgId }
}

async function requireNotLocked(userId: string, taskId: number) {
  const cutoff = new Date(Date.now() - LOCK_TTL_MS)
  const lock = await db.query.taskPresence.findFirst({
    where: and(
      eq(taskPresence.taskId, taskId),
      eq(taskPresence.mode, 'editing'),
      gt(taskPresence.lastSeenAt, cutoff),
      ne(taskPresence.userId, userId),
    ),
    with: { user: { columns: { displayName: true, email: true } } },
  })
  if (!lock) return
  const name = lock.user?.displayName ?? lock.user?.email ?? 'En annen bruker'
  throw new Error(`Oppgaven er låst (redigeres av ${name})`)
}

async function resolveAssigneeIds(
  currentUserId: string,
  orgId: number | null,
  assigneeIds: string[],
): Promise<string[]> {
  const unique = [...new Set(assigneeIds.filter(Boolean))]
  if (unique.length === 0) return []

  if (!orgId) {
    if (unique.length !== 1 || unique[0] !== currentUserId) {
      throw new Error('Personlige oppgaver kan bare tildeles deg selv')
    }
    return unique
  }

  for (const assigneeId of unique) {
    const member = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, assigneeId),
      ),
      columns: { id: true },
    })
    if (!member) throw new Error('Valgt ansvarlig er ikke medlem av organisasjonen')
  }

  return unique
}

async function getTaskAssigneeIds(taskId: number): Promise<string[]> {
  const rows = await db.query.taskAssignees.findMany({
    where: eq(taskAssignees.taskId, taskId),
    columns: { userId: true },
  })
  return rows.map((row) => row.userId).sort()
}

async function syncTaskAssignees(taskId: number, userIds: string[]) {
  await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId))
  if (userIds.length === 0) return
  await db.insert(taskAssignees).values(
    userIds.map((userId) => ({ taskId, userId })),
  )
}

function snapshotTaskRow(task: {
  title:       string
  description: string | null
  deadline:    string | null
  statusId:    number | null
  groupId:     number | null
  order:       number
  updatedAt:   Date | null
  orgId:       number | null
}, assigneeIds: string[]) {
  return {
    title:       task.title,
    description: task.description,
    deadline:    task.deadline,
    statusId:    task.statusId,
    groupId:     task.groupId,
    assigneeIds: [...assigneeIds].sort(),
    order:       task.order,
    updatedAt:   task.updatedAt,
    orgId:       task.orgId,
  }
}

const TRACKED_FIELDS = ['title', 'description', 'deadline', 'statusId', 'groupId', 'assigneeIds'] as const

function hasTrackedChanges(
  before: ReturnType<typeof snapshotTaskRow>,
  after:  ReturnType<typeof snapshotTaskRow>
): boolean {
  return TRACKED_FIELDS.some((key) => {
    if (key === 'assigneeIds') {
      const a = before.assigneeIds
      const b = after.assigneeIds
      if (a.length !== b.length) return true
      return a.some((id, index) => id !== b[index])
    }
    return before[key] !== after[key]
  })
}

function isMissingRevisionsTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const anyErr = err as any
  const code   = anyErr.code ?? anyErr.cause?.code
  if (code === '42P01') return true
  const msg = String(anyErr.message ?? anyErr.cause?.message ?? '')
  return msg.includes('relation "task_revisions" does not exist')
}

export async function acquireTaskLock(taskId: number) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' as const }

  try {
    const { orgId } = await requireCanEditTask(session.user.id, taskId)
    if (!orgId) return { error: 'Låser brukes bare for organisasjonsoppgaver' as const }

    const cutoff   = new Date(Date.now() - LOCK_TTL_MS)
    const existing = await db.query.taskPresence.findFirst({
      where: and(
        eq(taskPresence.taskId, taskId),
        eq(taskPresence.mode, 'editing'),
        gt(taskPresence.lastSeenAt, cutoff),
        ne(taskPresence.userId, session.user.id),
      ),
      with: { user: { columns: { displayName: true, email: true, avatarUrl: true } } },
    })

    if (existing) {
      return {
        success:  false as const,
        lockedBy: {
          userId:      existing.userId,
          displayName: existing.user?.displayName ?? null,
          email:       existing.user?.email ?? null,
          avatarUrl:   existing.user?.avatarUrl ?? null,
        },
      }
    }

    await db.insert(taskPresence).values({
      orgId,
      taskId,
      userId:     session.user.id,
      mode:       'editing',
      lastSeenAt: new Date(),
    }).onConflictDoUpdate({
      target: [taskPresence.taskId, taskPresence.userId],
      set:    { orgId, mode: 'editing', lastSeenAt: new Date() },
    })

    return { success: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' as const }
  }
}

export async function releaseTaskLock(taskId: number) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' as const }

  try {
    const { orgId } = await requireCanEditTask(session.user.id, taskId)
    if (!orgId) return { success: true as const }

    await db.delete(taskPresence).where(and(
      eq(taskPresence.taskId, taskId),
      eq(taskPresence.userId, session.user.id),
      eq(taskPresence.orgId, orgId),
    ))

    return { success: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' as const }
  }
}

export async function createTask(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  // Deklarer slug utenfor try så den er tilgjengelig for redirect
  let slug    = ''
  let orgSlug = ''

  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const title = formData.get('title') as string
    if (!title?.trim()) return { error: 'Tittel er påkrevd' }

    const baseSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const orgId    = formData.get('orgId')   ? Number(formData.get('orgId'))   : null
    const groupId  = formData.get('groupId') && formData.get('groupId') !== 'none'
      ? Number(formData.get('groupId'))
      : null
    const assigneeIds = formData.getAll('assigneeIds')
      .map((value) => String(value))
      .filter(Boolean)

    slug    = await generateUniqueSlug(baseSlug, orgId)
    orgSlug = (formData.get('orgSlug') as string) ?? ''

    const firstStatus = await db.query.statuses.findFirst({
      where: orgId
        ? eq(statuses.orgId, orgId)
        : and(eq(statuses.userId, session.user.id), isNull(statuses.orgId)),
      orderBy: [asc(statuses.order)],
    })

    const resolvedAssigneeIds = await resolveAssigneeIds(session.user.id, orgId, assigneeIds)

    const [created] = await db.insert(tasks).values({
      title,
      description: (formData.get('description') as string) || null,
      slug,
      deadline:    (formData.get('deadline') as string) || null,
      groupId,
      statusId:    firstStatus?.id ?? null,
      orgId,
      createdBy:   session.user.id,
    }).returning({ id: tasks.id })

    await syncTaskAssignees(created.id, resolvedAssigneeIds)

    revalidatePath('/tasks')
    if (orgSlug) revalidatePath(`/org/${orgSlug}`)
  } catch (e) {
    console.error('createTask feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }

  // redirect må være utenfor try/catch
  redirect(orgSlug ? `/org/${orgSlug}/${slug}` : `/tasks/${slug}`)
}

export async function updateTask(
  taskId: number,
  data: {
    title?:       string
    description?: string
    deadline?:    string | null
    statusId?:    number | null
    groupId?:     number | null
    assigneeIds?: string[]
  }
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const { orgId } = await requireCanEditTask(session.user.id, taskId)
    await requireNotLocked(session.user.id, taskId)

    const { assigneeIds, ...taskFields } = data
    const nextData = { ...taskFields }
    let resolvedAssigneeIds: string[] | undefined

    if (assigneeIds !== undefined) {
      resolvedAssigneeIds = await resolveAssigneeIds(session.user.id, orgId, assigneeIds)
    }

    const beforeRow = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        title:       true,
        description: true,
        deadline:    true,
        statusId:    true,
        groupId:     true,
        order:       true,
        updatedAt:   true,
        orgId:       true,
      },
    })
    if (!beforeRow) return { error: 'Oppgave ikke funnet' }

    const beforeAssigneeIds = await getTaskAssigneeIds(taskId)

    const [afterRow] = await db.update(tasks)
      .set({ ...nextData, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning({
        title:       tasks.title,
        description: tasks.description,
        deadline:    tasks.deadline,
        statusId:    tasks.statusId,
        groupId:     tasks.groupId,
        order:       tasks.order,
        updatedAt:   tasks.updatedAt,
        orgId:       tasks.orgId,
      })

    if (resolvedAssigneeIds !== undefined) {
      await syncTaskAssignees(taskId, resolvedAssigneeIds)
    }

    const afterAssigneeIds = resolvedAssigneeIds ?? beforeAssigneeIds

    if (afterRow && hasTrackedChanges(
      snapshotTaskRow(beforeRow, beforeAssigneeIds),
      snapshotTaskRow(afterRow, afterAssigneeIds),
    )) {
      try {
        await db.insert(taskRevisions).values({
          orgId:  afterRow.orgId ?? null,
          taskId,
          userId: session.user.id,
          action: 'update',
          before: snapshotTaskRow(beforeRow, beforeAssigneeIds) as any,
          after:  snapshotTaskRow(afterRow, afterAssigneeIds)  as any,
        })
      } catch (e) {
        if (!isMissingRevisionsTableError(e)) throw e
      }
    }

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${taskId}`)
    return { success: true }
  } catch (e) {
    console.error('updateTask feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function updateTaskStatus(
  taskId:      number,
  statusLabel: string,
  orgId?:      number,
  userId?:     string
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const { orgId: taskOrgId } = await requireCanEditTask(session.user.id, taskId)
    await requireNotLocked(session.user.id, taskId)

    const resolvedOrgId = taskOrgId ?? orgId ?? null

    const status = await db.query.statuses.findFirst({
      where: resolvedOrgId
        ? and(eq(statuses.orgId, resolvedOrgId),          eq(statuses.label, statusLabel))
        : and(eq(statuses.userId, session.user.id),       eq(statuses.label, statusLabel)),
    })
    if (!status) return { error: 'Status ikke funnet' }

    const beforeRow = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        title:       true,
        description: true,
        deadline:    true,
        statusId:    true,
        groupId:     true,
        order:       true,
        updatedAt:   true,
        orgId:       true,
      },
    })
    if (!beforeRow) return { error: 'Oppgave ikke funnet' }

    const assigneeIds = await getTaskAssigneeIds(taskId)

    // Ingen endring
    if (beforeRow.statusId === status.id) return { success: true }

    await db.update(tasks)
      .set({ statusId: status.id, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))

    const afterRow = { ...beforeRow, statusId: status.id, updatedAt: new Date() }
    try {
      await db.insert(taskRevisions).values({
        orgId:  beforeRow.orgId ?? null,
        taskId,
        userId: session.user.id,
        action: 'status',
        before: snapshotTaskRow(beforeRow, assigneeIds) as any,
        after:  snapshotTaskRow(afterRow, assigneeIds)  as any,
      })
    } catch (e) {
      if (!isMissingRevisionsTableError(e)) throw e
    }

    return { success: true }
  } catch (e) {
    console.error('updateTaskStatus error:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function updateTaskOrder(
  taskIds: number[]
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await Promise.all(taskIds.map((id) => requireCanEditTask(session.user.id, id)))

    await Promise.all(
      taskIds.map((id, index) =>
        db.update(tasks).set({ order: index }).where(eq(tasks.id, id))
      )
    )
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function updateTaskGroup(
  taskId:  number,
  groupId: number | null
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await requireCanEditTask(session.user.id, taskId)
    await requireNotLocked(session.user.id, taskId)

    const beforeRow = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        title:       true,
        description: true,
        deadline:    true,
        statusId:    true,
        groupId:     true,
        order:       true,
        updatedAt:   true,
        orgId:       true,
      },
    })
    if (!beforeRow) return { error: 'Oppgave ikke funnet' }

    const assigneeIds = await getTaskAssigneeIds(taskId)

    // Ingen endring
    if (beforeRow.groupId === groupId) return { success: true }

    await db.update(tasks)
      .set({ groupId, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))

    const afterRow = { ...beforeRow, groupId, updatedAt: new Date() }
    try {
      await db.insert(taskRevisions).values({
        orgId:  beforeRow.orgId ?? null,
        taskId,
        userId: session.user.id,
        action: 'group',
        before: snapshotTaskRow(beforeRow, assigneeIds) as any,
        after:  snapshotTaskRow(afterRow, assigneeIds)  as any,
      })
    } catch (e) {
      if (!isMissingRevisionsTableError(e)) throw e
    }

    revalidatePath('/tasks')
    revalidatePath('/org/[slug]', 'page')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function deleteTask(
  taskId: number
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await requireCanEditTask(session.user.id, taskId)
    await requireNotLocked(session.user.id, taskId)

    // Clean up related rows first (in case FK constraints are strict).
    await db.delete(taskPresence).where(eq(taskPresence.taskId, taskId))
    await db.delete(taskRevisions).where(eq(taskRevisions.taskId, taskId))

    await db.delete(tasks).where(eq(tasks.id, taskId))

    revalidatePath('/tasks')
    revalidatePath('/org/[slug]', 'page')

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

async function generateUniqueSlug(baseSlug: string, orgId: number | null): Promise<string> {
  let slug    = baseSlug
  let counter = 1

  while (true) {
    const existing = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.slug, slug),
        orgId ? eq(tasks.orgId, orgId) : isNull(tasks.orgId)
      ),
    })

    if (!existing) return slug

    slug = `${baseSlug}-${counter}`
    counter++
  }
}