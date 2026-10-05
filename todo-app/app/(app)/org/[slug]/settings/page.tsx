// app/org/[slug]/settings/page.tsx
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, organizationMembers, invitations } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { OrgSettingsPage } from '@/components/OrgSettings/OrgSettingsPage'
import { SetBreadcrumbLabel } from '@/components/Breadcrumbs/SetBreadcrumbLabel'

export const dynamic = 'force-dynamic'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  })
  if (!org) notFound()

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, session.user.id)
    ),
  })
  if (!membership) redirect(`/org/${slug}`)

  const isAdmin = ['owner', 'admin'].includes(membership.role)

  const [members, pendingInvites] = isAdmin
    ? await Promise.all([
        db.query.organizationMembers.findMany({
          where: eq(organizationMembers.orgId, org.id),
          with: { user: true },
        }),
        db.query.invitations.findMany({
          where: eq(invitations.orgId, org.id),
        }),
      ])
    : [[], []]

  return (
    <>
      <SetBreadcrumbLabel segment={slug} label={org.name} />
      <OrgSettingsPage
        org={org}
        currentUserId={session.user.id}
        currentRole={membership.role}
        members={members}
        pendingInvites={pendingInvites}
      />
    </>
  )
}