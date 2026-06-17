'use server'

import { db } from '@/lib/db'
import { comments } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'

export async function createComment(
  _prev: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const content = formData.get('content') as string
    const taskId  = Number(formData.get('taskId'))

    if (!content?.trim()) return { error: 'Kommentar kan ikke være tom' }
    if (!taskId)          return { error: 'Task ID mangler' }

    await db.insert(comments).values({
      content,
      taskId,
      userId: session.user.id,
    })

    revalidatePath('/tasks')
    revalidatePath('/tasks/[slug]', 'page')
    revalidatePath('/org/[slug]/[taskSlug]', 'page')
    return { success: true }
  } catch (e) {
    console.error('createComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function updateComment(
  commentId: number,
  content: string
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    if (!content?.trim()) return { error: 'Kommentar kan ikke være tom' }

    await db.update(comments)
      .set({ content, updatedAt: new Date() })
      .where(and(
        eq(comments.id, commentId),
        eq(comments.userId, session.user.id)
      ))

    revalidatePath('/tasks')
    revalidatePath('/tasks/[slug]', 'page')
    revalidatePath('/org/[slug]/[taskSlug]', 'page')
    return { success: true }
  } catch (e) {
    console.error('updateComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function deleteComment(
  commentId: number
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    await db.delete(comments)
      .where(and(
        eq(comments.id, commentId),
        eq(comments.userId, session.user.id)
      ))

    revalidatePath('/tasks')
    revalidatePath('/tasks/[slug]', 'page')
    revalidatePath('/org/[slug]/[taskSlug]', 'page')
    return { success: true }
  } catch (e) {
    console.error('deleteComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}