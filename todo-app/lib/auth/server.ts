import 'server-only'

import { createNeonAuth } from '@neondatabase/auth/next/server'
import { buildDemoSession, clearDemoSessionCookie, hasDemoSession } from '@/lib/demo/session'

const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})

async function getSessionWithDemo() {
  const { data: session } = await neonAuth.getSession()
  if (session?.user) return { data: session }

  if (await hasDemoSession()) {
    const demoSession = buildDemoSession()
    if (demoSession) return { data: demoSession }
  }

  return { data: session }
}

export const auth = {
  ...neonAuth,
  getSession: getSessionWithDemo,
}

export async function signOutApp() {
  await clearDemoSessionCookie()
  await neonAuth.signOut()
}
