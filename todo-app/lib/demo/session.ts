import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { getDemoUserId, getDemoUserEmail } from './config'

const COOKIE_NAME = 'demo_session'
const COOKIE_PAYLOAD = 'active'

function getSecret() {
  return process.env.NEON_AUTH_COOKIE_SECRET?.trim()
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function isValidDemoCookie(value: string | undefined | null): boolean {
  const secret = getSecret()
  if (!secret || !value) return false

  const [payload, sig] = value.split('.')
  if (payload !== COOKIE_PAYLOAD || !sig) return false

  const expected = signPayload(payload, secret)
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function setDemoSessionCookie() {
  const secret = getSecret()
  if (!secret) throw new Error('NEON_AUTH_COOKIE_SECRET is not configured')

  const sig = signPayload(COOKIE_PAYLOAD, secret)
  const store = await cookies()
  store.set(COOKIE_NAME, `${COOKIE_PAYLOAD}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export async function clearDemoSessionCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function hasDemoSession(): Promise<boolean> {
  const store = await cookies()
  return isValidDemoCookie(store.get(COOKIE_NAME)?.value)
}

export function buildDemoSession() {
  const userId = getDemoUserId()
  const email = getDemoUserEmail()
  if (!userId) return null

  return {
    user: {
      id: userId,
      email,
      name: 'Demo User',
      image: null,
      emailVerified: true,
    },
  }
}
