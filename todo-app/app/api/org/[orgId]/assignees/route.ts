import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizationMembers } from '@/lib/db/schema'
import { getOrgAssigneeOptions } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  const { data: session } = await auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orgId: orgIdRaw } = await ctx.params
  const orgId = Number(orgIdRaw)
  if (!orgId) {
    return NextResponse.json({ error: 'Invalid orgId' }, { status: 400 })
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.userId, session.user.id),
    ),
    columns: { id: true },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const assignees = await getOrgAssigneeOptions(orgId)
  return NextResponse.json({ assignees })
}
