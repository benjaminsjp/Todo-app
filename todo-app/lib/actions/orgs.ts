'use server'

import { db } from '@/lib/db'
import { organizations, organizationMembers, statuses } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { transferOrDeleteOrg } from '@/lib/db/orgOwnership'

const DEFAULT_STATUSES = [
  { label: 'Todo',        color: 'gray',  icon: 'CircleDashed',   order: 0 },
  { label: 'In Progress', color: 'blue',  icon: 'CircleEllipsis', order: 1 },
  { label: 'Done',        color: 'green', icon: 'CircleCheck',    order: 2 },
]

export async function createOrganization(
  _prev: { error: string } | { slug: string } | null,
  formData: FormData
): Promise<{ error: string } | { slug: string }> {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Name is required' }

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const [org] = await db.insert(organizations).values({ name, slug }).returning()

  await db.insert(organizationMembers).values({
    orgId:  org.id,
    userId: session.user.id,
    role:   'owner',
  })

  await db.insert(statuses).values(
    DEFAULT_STATUSES.map((s) => ({ ...s, orgId: org.id }))
  )

  revalidatePath('/', 'layout')

  return { slug: org.slug }
}

export async function leaveOrganization(orgSlug: string) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  })
  if (!org) return { error: 'Organization not found' }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, session.user.id),
    ),
  })
  if (!membership) return { error: 'You are not a member of this organization' }

  if (membership.role === 'owner') {
    await transferOrDeleteOrg(org.id, session.user.id)
  }

  await db.delete(organizationMembers).where(eq(organizationMembers.id, membership.id))

  revalidatePath('/', 'layout')
  revalidatePath('/org')
  revalidatePath(`/org/${orgSlug}`)

  return { success: true as const }
}

export async function deleteOrganization(orgSlug: string) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  })
  if (!org) return { error: 'Organization not found' }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, session.user.id),
    ),
  })
  if (!membership || membership.role !== 'owner') {
    return { error: 'Only the owner can delete this organization' }
  }

  await db.delete(organizations).where(eq(organizations.id, org.id))

  revalidatePath('/', 'layout')
  revalidatePath('/org')

  return { success: true as const }
}
