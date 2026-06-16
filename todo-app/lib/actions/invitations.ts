'use server'

import { db } from '@/lib/db'
import { invitations, organizationMembers, organizations } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { getAppBaseUrl } from '@/lib/utils/appUrl'
import { transferOrDeleteOrg } from '@/lib/db/orgOwnership'

async function requireOrgAdmin(userId: string, orgId: number) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
    ),
  })
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Unauthorized')
  }
  return membership
}

export async function createInvitation(
  _prev: { error: string } | { link: string } | null,
  formData: FormData
): Promise<{ error: string } | { link: string }> {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const orgId = Number(formData.get('orgId'))
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role  = (formData.get('role') as string) || 'member'

  if (!email) return { error: 'Email is required' }

  try {
    await requireOrgAdmin(session.user.id, orgId)
  } catch {
    return { error: 'You do not have permission to invite members' }
  }

  // Check if already a member
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  })
  if (existingUser) {
    const existingMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, existingUser.id),
      ),
    })
    if (existingMember) return { error: 'This person is already a member' }
  }

  const existing = await db.query.invitations.findFirst({
    where: and(eq(invitations.orgId, orgId), eq(invitations.email, email)),
  })
  if (existing) {
    await db.delete(invitations).where(eq(invitations.id, existing.id))
  }

  const token     = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.insert(invitations).values({
    orgId,
    email,
    role:  role as 'owner' | 'admin' | 'member' | 'viewer',
    token,
    expiresAt,
  })

  revalidatePath(`/org/${formData.get('orgSlug')}/settings`)

  const baseUrl = await getAppBaseUrl()
  return { link: `${baseUrl}/invite/${token}` }
}

export async function deleteInvitation(id: number, orgSlug: string) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.id, id),
    with: { org: true },
  })
  if (!invitation) return { error: 'Invitation not found' }

  try {
    await requireOrgAdmin(session.user.id, invitation.orgId)
  } catch {
    return { error: 'Unauthorized' }
  }

  await db.delete(invitations).where(eq(invitations.id, id))
  revalidatePath(`/org/${orgSlug}/settings`)
  return { success: true }
}

export async function removeMember(memberId: number, orgSlug: string) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const member = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.id, memberId),
  })
  if (!member) return { error: 'Member not found' }

  try {
    await requireOrgAdmin(session.user.id, member.orgId)
  } catch {
    return { error: 'Unauthorized' }
  }

  if (member.role === 'owner') {
    await transferOrDeleteOrg(member.orgId, member.userId)
    await db.delete(organizationMembers).where(eq(organizationMembers.id, memberId))
    revalidatePath('/', 'layout')
    revalidatePath(`/org/${orgSlug}/settings`)
    return { success: true }
  }

  await db.delete(organizationMembers).where(eq(organizationMembers.id, memberId))
  revalidatePath(`/org/${orgSlug}/settings`)
  return { success: true }
}

export async function updateMemberRole(
  memberId: number,
  role: 'admin' | 'member' | 'viewer',
  orgSlug: string
) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const member = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.id, memberId),
  })
  if (!member) return { error: 'Member not found' }

  try {
    await requireOrgAdmin(session.user.id, member.orgId)
  } catch {
    return { error: 'Unauthorized' }
  }

  if (member.role === 'owner') return { error: 'Cannot change owner role' }

  await db.update(organizationMembers)
    .set({ role })
    .where(eq(organizationMembers.id, memberId))

  revalidatePath(`/org/${orgSlug}/settings`)
  return { success: true }
}

export async function acceptInvitation(
  token: string
): Promise<{ error: string } | { success: true }> {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
    with:  { org: true },
  })

  if (!invite)                        return { error: 'Invalid invitation' }
  if (invite.expiresAt < new Date())  return { error: 'Invitation has expired' }
  if (invite.email !== session.user.email) return { error: 'This invitation is for a different email' }

  await db.insert(organizationMembers).values({
    orgId:  invite.orgId,
    userId: session.user.id,
    role:   invite.role as 'owner' | 'admin' | 'member' | 'viewer',
  })

  await db.delete(invitations).where(eq(invitations.token, token))

  revalidatePath(`/org/${invite.org.slug}`)
  return { success: true }
}