'use server'

import { db } from '@/lib/db'
import { taskGroups } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

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