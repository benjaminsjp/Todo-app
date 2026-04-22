'use server'

import { db } from '@/lib/db'
import { tasks, statuses } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq, and, isNull } from 'drizzle-orm'
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

    const baseSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    const orgId   = formData.get('orgId')   ? Number(formData.get('orgId'))   : null
    const groupId = formData.get('groupId') ? Number(formData.get('groupId')) : null
    
    const slug     = await generateUniqueSlug(baseSlug, orgId)
    
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

export async function updateTaskStatus(
  taskId: number,
  statusLabel: string,
  orgId?: number,
  userId?: string
): Promise<{ error: string } | { success: true }> {
  try {
    console.log('updateTaskStatus called:', { taskId, statusLabel, orgId, userId })

    const status = await db.query.statuses.findFirst({
      where: orgId
        ? and(eq(statuses.orgId, orgId), eq(statuses.label, statusLabel))
        : and(eq(statuses.userId, userId!), eq(statuses.label, statusLabel)),
    })

    console.log('found status:', status)

    if (!status) return { error: 'Status not found' }

    await db
      .update(tasks)
      .set({ statusId: status.id, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))

    return { success: true }
  } catch (e) {
    console.error('updateTaskStatus error:', e)
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function updateTaskOrder(
  taskIds: number[]
): Promise<{ error: string } | { success: true }> {
  try {
    await Promise.all(
      taskIds.map((id, index) =>
        db.update(tasks).set({ order: index }).where(eq(tasks.id, id))
      )
    )
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function updateTaskGroup(
  taskId: number,
  groupId: number | null
): Promise<{ error: string } | { success: true }> {
  try {
    await db
      .update(tasks)
      .set({ groupId, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
    
    revalidatePath('/tasks')
    revalidatePath('/org/[slug]', 'page')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
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