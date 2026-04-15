'use server'

import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function createTask(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  let slug = ''

  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const title = formData.get('title') as string
    if (!title?.trim()) return { error: 'Tittel er påkrevd' }

    slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const orgId   = formData.get('orgId')   ? Number(formData.get('orgId'))   : null
    const groupId = formData.get('groupId') ? Number(formData.get('groupId')) : null

    await db.insert(tasks).values({
      title,
      description: (formData.get('description') as string) || null,
      slug,
      deadline:    (formData.get('deadline') as string) || null,
      groupId,
      orgId,
      createdBy: session.user.id,
    })

    revalidatePath('/tasks')
  } catch (e) {
    console.error('createTask feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }

  const orgSlug = formData.get('orgSlug') as string | null

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
  }
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await db.update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.createdBy, session.user.id)
      ))

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${taskId}`)
    return { success: true }
  } catch (e) {
    console.error('updateTask feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function updateTaskStatus(taskId: number, statusId: number) {
  return updateTask(taskId, { statusId })
}