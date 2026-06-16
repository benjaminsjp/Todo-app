'use server'

import { db } from '@/lib/db'
import { statuses, tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

export async function createStatus(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const label = formData.get('label') as string
  if (!label?.trim()) return { error: 'Label is required' }

  const color  = (formData.get('color') as string) || 'gray'
  const icon   = (formData.get('icon') as string) || null
  const orgId  = formData.get('orgId')  ? Number(formData.get('orgId'))  : null
  const userId = !orgId ? session.user.id : null

  // Get current highest order
  const existing = await db.query.statuses.findMany({
    where: orgId
      ? eq(statuses.orgId, orgId)
      : eq(statuses.userId, session.user.id),
  })

  await db.insert(statuses).values({
    label,
    color,
    icon:   icon ?? undefined,
    order:  existing.length,
    orgId:  orgId  ?? undefined,
    userId: userId ?? undefined,
  })

  revalidatePath('/tasks')
  if (orgId) revalidatePath(`/org/[slug]`, 'page')

  return null
}

export async function updateStatus(
  statusId: number,
  data: { label?: string; color?: string }
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Not logged in' }

    await db.update(statuses)
      .set(data)
      .where(eq(statuses.id, statusId))

    revalidatePath('/tasks')
    revalidatePath('/org/[slug]', 'page')
    return { success: true }
  } catch (e) {
    console.error('updateStatus feil:', e)
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function deleteStatus(
  statusId: number
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Not logged in' }

    // Fjern status-referansen fra tasks først
    await db.update(tasks)
      .set({ statusId: null })
      .where(eq(tasks.statusId, statusId))

    await db.delete(statuses)
      .where(eq(statuses.id, statusId))

    revalidatePath('/tasks')
    revalidatePath('/org/[slug]', 'page')
    return { success: true }
  } catch (e) {
    console.error('deleteStatus feil:', e)
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}