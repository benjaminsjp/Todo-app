'use server'

import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

export async function createTask(
  _prev: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true } | null> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const title = formData.get('title') as string
    if (!title?.trim()) return { error: 'Tittel er påkrevd' }

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const orgId   = formData.get('orgId')   ? Number(formData.get('orgId'))   : null
    const groupId = formData.get('groupId') ? Number(formData.get('groupId')) : null

    await db.insert(tasks).values({
      title,
      description: (formData.get('description') as string) || null,
      slug,
      deadline:    (formData.get('deadline') as string) || null,
      groupId,
      orgId,
      createdBy:   session.user.id,
    })

    revalidatePath('/tasks')
    return { success: true }
  } catch (e) {
    console.error('createTask feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}