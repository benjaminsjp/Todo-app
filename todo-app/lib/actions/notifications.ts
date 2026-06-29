'use server'

import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizationMembers, tasks, userNotifications, users } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireCanEditTask(userId: string, taskId: number) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    columns: { id: true, orgId: true, createdBy: true },
  })
  if (!task) throw new Error('Oppgave ikke funnet')

  if (!task.orgId) {
    if (task.createdBy !== userId) throw new Error('Ingen tilgang')
    return task
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, task.orgId),
      eq(organizationMembers.userId, userId),
    ),
    columns: { role: true },
  })
  if (!membership || membership.role === 'viewer') throw new Error('Ingen tilgang')

  return task
}

export async function notifyTaskAssignee(taskId: number, assigneeUserId: string) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' as const }

    if (assigneeUserId === session.user.id) {
      return { error: 'Du kan ikke varsle deg selv' as const }
    }

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        id: true,
        title: true,
        slug: true,
        orgId: true,
        createdBy: true,
      },
      with: {
        org: { columns: { slug: true } },
      },
    })
    if (!task) return { error: 'Oppgave ikke funnet' as const }

    await requireCanEditTask(session.user.id, taskId)

    const assignee = await db.query.users.findFirst({
      where: eq(users.id, assigneeUserId),
      columns: { id: true },
    })
    if (!assignee) return { error: 'Bruker ikke funnet' as const }

    const sender = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { displayName: true, email: true },
    })

    await db.insert(userNotifications).values({
      userId:       assigneeUserId,
      type:         'task_assigned',
      taskId:       task.id,
      taskTitle:    task.title,
      taskSlug:     task.slug,
      orgSlug:      task.org?.slug ?? null,
      fromUserId:   session.user.id,
      fromUserName: sender?.displayName ?? sender?.email ?? 'Noen',
    })

    revalidatePath('/api/notifications')
    return { success: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' as const }
  }
}

export async function notifyAllTaskAssignees(taskId: number) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' as const }

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        id: true,
        title: true,
        slug: true,
        orgId: true,
        createdBy: true,
      },
      with: {
        org: { columns: { slug: true } },
        assignees: { with: { user: { columns: { id: true } } } },
      },
    })
    if (!task) return { error: 'Oppgave ikke funnet' as const }

    await requireCanEditTask(session.user.id, taskId)

    const assigneeIds = task.assignees
      .map((row) => row.user?.id)
      .filter((id): id is string => id != null && id !== session.user.id)

    if (assigneeIds.length === 0) {
      return { error: 'Ingen ansvarlige å varsle' as const }
    }

    const sender = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { displayName: true, email: true },
    })
    const fromUserName = sender?.displayName ?? sender?.email ?? 'Noen'

    await db.insert(userNotifications).values(
      assigneeIds.map((userId) => ({
        userId,
        type:         'task_assigned' as const,
        taskId:       task.id,
        taskTitle:    task.title,
        taskSlug:     task.slug,
        orgSlug:      task.org?.slug ?? null,
        fromUserId:   session.user.id,
        fromUserName,
      })),
    )

    revalidatePath('/api/notifications')
    return { success: true as const, count: assigneeIds.length }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' as const }
  }
}

export async function markNotificationRead(notificationId: number) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' as const }

    await db.update(userNotifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(userNotifications.id, notificationId),
        eq(userNotifications.userId, session.user.id),
        isNull(userNotifications.readAt),
      ))

    revalidatePath('/api/notifications')
    return { success: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' as const }
  }
}
