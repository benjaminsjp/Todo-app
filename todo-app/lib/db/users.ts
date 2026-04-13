import 'server-only'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function syncUser(authUser: { id: string; email: string; name?: string | null; image?: string | null }) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  })

  if (!existing) {
    await db.insert(users).values({
      id:          authUser.id,
      email:       authUser.email,
      displayName: authUser.name ?? null,
      avatarUrl:   authUser.image ?? null,
    })
  }

  return existing ?? authUser
}