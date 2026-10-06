import { ensureUserReady } from '@/lib/auth/ensureUserReady'

type AuthUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

/** Runs user sync in parallel with the rest of the shell (non-blocking). */
export async function UserReadyGate({ user }: { user: AuthUser }) {
  await ensureUserReady(user)
  return null
}
