'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { del, list } from '@vercel/blob'
import { isDemoUser } from '@/lib/demo/config'
import { deleteUserFromDatabase } from '@/lib/db/userCleanup'

export async function updateProfile(
  _prev: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Not logged in' }

    const displayName = formData.get('displayName') as string
    const avatarUrl   = formData.get('avatarUrl') as string

    if (!displayName?.trim()) return { error: 'Name is required' }

    await db.update(users)
      .set({
        displayName: displayName.trim(),
        avatarUrl:   avatarUrl?.trim() || null,
      })
      .where(eq(users.id, session.user.id))

    revalidatePath('/account')
    return { success: true }
  } catch (e) {
    console.error('updateProfile error:', e)
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function deleteAccount() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }
  if (isDemoUser(session.user)) return { error: 'Demo accounts cannot be deleted.' }

  try {
    const { blobs } = await list({ prefix: `avatars/${session.user.id}` })
    await Promise.all(blobs.map((blob) => del(blob.url)))

    await deleteUserFromDatabase(session.user.id)

    const { error } = await auth.deleteUser()
    if (error) console.error('Neon auth deleteUser error:', error)

    await auth.signOut()
    return { success: true }
  } catch (e) {
    console.error('deleteAccount error:', e)
    return { error: e instanceof Error ? e.message : 'Could not delete account' }
  }
}
