import 'server-only'

import { createNeonAuth } from '@neondatabase/auth/next/server'
import { buildDemoSession, clearDemoSessionCookie, hasDemoSession } from '@/lib/demo/session'

const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})

function isCookieMutationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Cookies can only be modified')
  )
}

async function getSessionWithDemo() {
  let session = null

  try {
    const { data } = await neonAuth.getSession()
    session = data
  } catch (error) {
    // After sign-out, stale auth cookies can make Neon Auth try to refresh
    // session cookies during RSC render, which Next.js forbids.
    if (!isCookieMutationError(error)) throw error
  }

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
