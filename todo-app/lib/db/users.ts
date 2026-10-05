import 'server-only'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export async function syncUser(authUser: {
  id:     string
  email:  string
  name?:  string | null
  image?: string | null
}) {
  await db.insert(users).values({
    id:          authUser.id,
    email:       authUser.email,
    displayName: authUser.name  ?? null,
    avatarUrl:   authUser.image ?? null,
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      email:       authUser.email,
      displayName: authUser.name ?? null,
      // Keep custom blob avatars; auth profile image is often null and would wipe uploads.
      ...(authUser.image ? { avatarUrl: authUser.image } : {}),
    },
  })
}