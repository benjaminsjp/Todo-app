'use server'

import { db } from '@/lib/db'
import { comments } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

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

    revalidatePath(`/tasks`)
    return { success: true }
  } catch (e) {
    console.error('createComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}