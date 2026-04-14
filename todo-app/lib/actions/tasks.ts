'use server'

import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

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

    slug    = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
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

  redirect(`/tasks/${slug}`)
}

export async function updateTask(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const taskId = formData.get('taskId') as string
    if (!taskId) return { error: 'Task ID er påkrevd' }

    const updateData: any = {}

    const title = formData.get('title') as string | null
    if (title?.trim()) {
      updateData.title = title
    }

    const description = formData.get('description') as string | null
    if (description !== null) {
      updateData.description = description || null
    }

    const deadline = formData.get('deadline') as string | null
    if (deadline !== null) {
      updateData.deadline = deadline || null
    }

    const statusId = formData.get('statusId') as string | null
    if (statusId) {
      updateData.statusId = Number(statusId) || null
    }

    const groupId = formData.get('groupId') as string | null
    if (groupId) {
      updateData.groupId = Number(groupId) || null
    }

    const assigneeId = formData.get('assigneeId') as string | null
    if (assigneeId !== null) {
      updateData.assigneeId = assigneeId || null
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'Ingen endringer å lagre' }
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, Number(taskId)))

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${taskId}`)
  } catch (e) {
    console.error('updateTask feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }

  return null
}