import { auth } from '@/lib/auth/server'
import { getPendingInvitationsForEmail } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session?.user?.email) {
    return Response.json({ notifications: [] })
  }

  const invites = await getPendingInvitationsForEmail(session.user.email)

  return Response.json({
    notifications: invites.map((inv) => ({
      id:        `invite-${inv.id}`,
      type:      'org_invitation' as const,
      token:     inv.token,
      orgName:   inv.org.name,
      orgSlug:   inv.org.slug,
      role:      inv.role,
      createdAt: inv.createdAt?.toISOString() ?? new Date().toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
    })),
  })
}
