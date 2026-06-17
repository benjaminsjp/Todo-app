'use server'

import { isDemoConfigured, getDemoUserId, getDemoUserEmail } from '@/lib/demo/config'
import { resetDemoData } from '@/lib/demo/seed'
import { setDemoSessionCookie } from '@/lib/demo/session'
import { syncUser } from '@/lib/db/users'
import { seedUserStatuses } from '@/lib/db/userStatuses'
import { db } from '@/lib/db'
import { statuses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function startDemoSession() {
  if (!isDemoConfigured()) {
    return { error: 'Demo mode is not configured. Set DEMO_USER_ID in your environment.' as const }
  }

  const userId = getDemoUserId()!
  const email = getDemoUserEmail()

  await syncUser({
    id: userId,
    email,
    name: 'Demo User',
    image: null,
  })

  const existing = await db.query.statuses.findFirst({
    where: eq(statuses.userId, userId),
  })
  if (!existing) {
    await seedUserStatuses(userId)
  }

  await setDemoSessionCookie()
  await resetDemoData(userId)

  return { success: true as const }
}
