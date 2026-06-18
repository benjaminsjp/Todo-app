'use server'

import { db } from '@/lib/db'
import { statuses, tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq, asc } from 'drizzle-orm'

export async function createStatus(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' }

  const label = formData.get('label') as string
  if (!label?.trim()) return { error: 'Navn er påkrevd' }

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
  data: { label?: string; color?: string; icon?: string | null }
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await db.update(statuses)
      .set(data)
      .where(eq(statuses.id, statusId))

    revalidatePath('/tasks')
    revalidatePath('/org/[slug]', 'page')
    return { success: true }
  } catch (e) {
    console.error('updateStatus feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function deleteStatus(
  statusId: number
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

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
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function reorderStatuses(
  orderedIds: number[]
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    if (orderedIds.length === 0) return { success: true }

    const first = await db.query.statuses.findFirst({
      where: eq(statuses.id, orderedIds[0]),
    })
    if (!first) return { error: 'Status ikke funnet' }

    const all = await db.query.statuses.findMany({
      where: first.orgId
        ? eq(statuses.orgId, first.orgId)
        : eq(statuses.userId, session.user.id),
    })

    const allowedIds = new Set(all.map((s) => s.id))
    if (
      orderedIds.length !== all.length ||
      !orderedIds.every((id) => allowedIds.has(id))
    ) {
      return { error: 'Ugyldig rekkefølge' }
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        db.update(statuses).set({ order: index }).where(eq(statuses.id, id))
      )
    )

    revalidatePath('/tasks')
    revalidatePath('/org/[slug]', 'page')
    return { success: true }
  } catch (e) {
    console.error('reorderStatuses feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function moveStatus(
  statusId: number,
  direction: 'left' | 'right'
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const status = await db.query.statuses.findFirst({
      where: eq(statuses.id, statusId),
    })
    if (!status) return { error: 'Status ikke funnet' }

    const all = await db.query.statuses.findMany({
      where: status.orgId
        ? eq(statuses.orgId, status.orgId)
        : eq(statuses.userId, session.user.id),
      orderBy: [asc(statuses.order), asc(statuses.id)],
    })

    const idx = all.findIndex((s) => s.id === statusId)
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= all.length) return { success: true }

    const reordered = [...all]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(swapIdx, 0, moved)

    return reorderStatuses(reordered.map((s) => s.id))
  } catch (e) {
    console.error('moveStatus feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}
