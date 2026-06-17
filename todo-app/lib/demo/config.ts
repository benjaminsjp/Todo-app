export const DEMO_ORG_SLUG = 'acme-team'

const DEFAULT_DEMO_EMAIL = 'demo@example.com'

export function getDemoUserId(): string | null {
  return process.env.DEMO_USER_ID?.trim() || null
}

export function getDemoUserEmail(): string {
  return process.env.DEMO_ACCOUNT_EMAIL?.trim() || DEFAULT_DEMO_EMAIL
}

/** Demo mode only needs a stable user id — no Neon Auth account required. */
export function isDemoConfigured(): boolean {
  return Boolean(getDemoUserId() && process.env.NEON_AUTH_COOKIE_SECRET?.trim())
}

export function isDemoEmail(email: string | null | undefined): boolean {
  const demoEmail = getDemoUserEmail().toLowerCase()
  if (!email) return false
  return email.trim().toLowerCase() === demoEmail
}

export function isDemoUser(user: { id?: string; email?: string | null } | null | undefined): boolean {
  if (!user) return false
  const demoUserId = getDemoUserId()
  if (demoUserId && user.id === demoUserId) return true
  return isDemoEmail(user.email)
}
