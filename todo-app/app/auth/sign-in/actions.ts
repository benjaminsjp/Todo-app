'use server'

import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { statuses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { seedUserStatuses } from '@/lib/db/userStatuses'
import { syncUser } from '@/lib/db/users'

export async function seedStatusesForCurrentUser() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  await syncUser({
    id:    session.user.id,
    email: session.user.email,
    name:  session.user.name,
    image: session.user.image,
  })

  const existing = await db.query.statuses.findFirst({
    where: eq(statuses.userId, session.user.id),
  })
  if (existing) return { success: true }

  await seedUserStatuses(session.user.id)
  return { success: true }
}
