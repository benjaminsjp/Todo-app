import { db } from '@/lib/db'
import { organizationMembers, organizations } from '@/lib/db/schema'
import { and, eq, ne } from 'drizzle-orm'

const ROLE_PRIORITY: Record<string, number> = {
  admin:  0,
  member: 1,
  viewer: 2,
  owner:  3,
}

export async function transferOrDeleteOrg(orgId: number, leavingUserId: string) {
  const members = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.orgId, orgId),
  })

  const others = members.filter((m) => m.userId !== leavingUserId)

  if (others.length === 0) {
    await db.delete(organizations).where(eq(organizations.id, orgId))
    return { deleted: true as const }
  }

  const successor = [...others].sort(
    (a, b) => (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99)
  )[0]

  await db.update(organizationMembers)
    .set({ role: 'owner' })
    .where(eq(organizationMembers.id, successor.id))

  return { deleted: false as const, newOwnerId: successor.userId }
}

export async function resolveOwnedOrganizations(userId: string) {
  const owned = await db.query.organizationMembers.findMany({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.role, 'owner'),
    ),
  })

  for (const membership of owned) {
    await transferOrDeleteOrg(membership.orgId, userId)
  }
}
