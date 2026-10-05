import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { statuses } from '@/lib/db/schema'
import { seedUserStatuses } from '@/lib/db/userStatuses'
import { syncUser } from '@/lib/db/users'

type AuthUser = {
  id:    string
  email: string
  name?: string | null
  image?: string | null
}

/** Sync auth user into app DB and seed default statuses once. */
export async function ensureUserReady(user: AuthUser) {
  await syncUser({
    id:    user.id,
    email: user.email,
    name:  user.name,
    image: user.image,
  })

  const existing = await db.query.statuses.findFirst({
    where: eq(statuses.userId, user.id),
  })
  if (!existing) await seedUserStatuses(user.id)
}
