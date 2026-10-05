'use server'

import { auth } from '@/lib/auth/server'
import { ensureUserReady } from '@/lib/auth/ensureUserReady'

/** @deprecated Prefer ensureUserReady in app layout; kept for legacy callers. */
export async function seedStatusesForCurrentUser() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Ikke innlogget' }

  await ensureUserReady(session.user)
  return { success: true }
}
