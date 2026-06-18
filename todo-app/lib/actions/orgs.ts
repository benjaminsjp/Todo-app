'use server'

import { db } from '@/lib/db'
import { organizations, organizationMembers, statuses } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { transferOrDeleteOrg } from '@/lib/db/orgOwnership'
import { DEFAULT_STATUSES } from '@/lib/statusDefaults'

export async function createOrganization(
  _prev: { error: string } | { slug: string } | null,
  formData: FormData
): Promise<{ error: string } | { slug: string }> {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Navn er påkrevd' }

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
  if (!session?.user) return { error: 'Ikke innlogget' }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  })
  if (!org) return { error: 'Organisasjonen ble ikke funnet' }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, session.user.id),
    ),
  })
  if (!membership) return { error: 'Du er ikke medlem av denne organisasjonen' }

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
  if (!session?.user) return { error: 'Ikke innlogget' }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  })
  if (!org) return { error: 'Organisasjonen ble ikke funnet' }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, session.user.id),
    ),
  })
  if (!membership || membership.role !== 'owner') {
    return { error: 'Bare eieren kan slette denne organisasjonen' }
  }

  await db.delete(organizations).where(eq(organizations.id, org.id))

  revalidatePath('/', 'layout')
  revalidatePath('/org')

  return { success: true as const }
}
