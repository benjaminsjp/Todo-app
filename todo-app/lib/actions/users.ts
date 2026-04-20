'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { del, list } from '@vercel/blob'

export async function updateProfile(
  _prev: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const displayName = formData.get('displayName') as string
    const avatarUrl   = formData.get('avatarUrl') as string

    if (!displayName?.trim()) return { error: 'Navn er påkrevd' }

    await db.update(users)
      .set({
        displayName: displayName.trim(),
        avatarUrl:   avatarUrl?.trim() || null,
      })
      .where(eq(users.id, session.user.id))

    revalidatePath('/account')
    return { success: true }
  } catch (e) {
    console.error('updateProfile feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function deleteAccount() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' }

  const { blobs } = await list({ prefix: `avatars/${session.user.id}` })
  await Promise.all(blobs.map((blob) => del(blob.url)))

  await db.delete(users).where(eq(users.id, session.user.id))
  await auth.signOut()

  return { success: true }
}



