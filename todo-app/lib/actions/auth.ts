'use server'

import { createNeonAuth } from '@neondatabase/auth/next/server'
import { clearDemoSessionCookie } from '@/lib/demo/session'

const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})

export async function signOutApp() {
  await clearDemoSessionCookie()
  await neonAuth.signOut()
}
