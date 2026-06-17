import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { invitations, organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AcceptInvitePage } from '@/components/OrgSettings/AcceptInvitePage'

export const dynamic = 'force-dynamic'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { data: session } = await auth.getSession()

  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
    with: { org: true },
  })

  if (!invite || invite.expiresAt < new Date()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-medium">Invalid invitation</h1>
        <p className="text-muted-foreground">This link is invalid or has expired.</p>
      </div>
    )
  }

  if (!session?.user) {
    redirect(`/auth/sign-in?redirect=/invite/${token}`)
  }

  if (session.user.email !== invite.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 max-w-sm mx-auto text-center px-4">
        <h1 className="text-2xl font-medium">Wrong account</h1>
        <p className="text-muted-foreground text-sm">
          This invitation was sent to <strong>{invite.email}</strong> but you are signed in as{' '}
          <strong>{session.user.email}</strong>.
        </p>
      </div>
    )
  }

  const existing = await db.query.organizationMembers.findFirst({
    where: (m, { and, eq }) =>
      and(eq(m.orgId, invite.orgId), eq(m.userId, session.user.id)),
  })
  if (existing) redirect(`/org/${invite.org.slug}`)

  return (
    <AcceptInvitePage
      token={token}
      orgName={invite.org.name}
      orgSlug={invite.org.slug}
      role={invite.role}
      email={invite.email}
    />
  )
}

