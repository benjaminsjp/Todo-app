'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { tasks, taskGroups } from '@/lib/db/schema'

export async function createTaskGroup(formData: FormData) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' }

  const title = formData.get('title') as string
  if (!title?.trim()) return { error: 'Tittel er påkrevd' }

  const orgId = formData.get('orgId') ? Number(formData.get('orgId')) : null

  await db.insert(taskGroups).values({
    title,
    color:     (formData.get('color') as string) || 'bg-gray-500',
    orgId,
    createdBy: session.user.id,
  })

  revalidatePath('/tasks')
}

export async function updateTaskGroup(
  groupId: number,
  data: { title?: string; color?: string }
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await db.update(taskGroups)
      .set(data)
      .where(and(
        eq(taskGroups.id, groupId),
        eq(taskGroups.createdBy, session.user.id)
      ))

    revalidatePath('/tasks')
    return { success: true }
  } catch (e) {
    console.error('updateTaskGroup feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function deleteTaskGroup(
  groupId: number
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await db.update(tasks)
      .set({ groupId: null })
      .where(eq(tasks.groupId, groupId))

    await db.delete(taskGroups)
      .where(and(
        eq(taskGroups.id, groupId),
        eq(taskGroups.createdBy, session.user.id)
      ))

    revalidatePath('/tasks')
    return { success: true }
  } catch (e) {
    console.error('deleteTaskGroup feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}