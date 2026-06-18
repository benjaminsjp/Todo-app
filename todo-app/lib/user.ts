import 'server-only'

import { cache } from 'react'
import { eq } from 'drizzle-orm'

import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const getCurrentUserProfile = cache(async () => {
  const { data: session } = await auth.getSession()
  if (!session?.user) return null

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { displayName: true, email: true, avatarUrl: true },
  })

  return {
    id:        session.user.id,
    name:      user?.displayName ?? session.user.name ?? null,
    email:     user?.email ?? session.user.email ?? null,
    avatarUrl: user?.avatarUrl ?? session.user.image ?? null,
  }
})
