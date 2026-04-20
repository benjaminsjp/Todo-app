import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, tasks, comments, taskGroups, organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
  }

  const userId = session.user.id

  const [user, userTasks, userComments, userGroups, userMemberships] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.tasks.findMany({
      where: eq(tasks.createdBy, userId),
      with: { status: true, group: true },
    }),
    db.query.comments.findMany({
      where: eq(comments.userId, userId),
    }),
    db.query.taskGroups.findMany({
      where: eq(taskGroups.createdBy, userId),
    }),
    db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, userId),
      with: { org: true },
    }),
  ])

  const exportData = {
    exportedAt:    new Date().toISOString(),
    user: {
      id:          user?.id,
      email:       user?.email,
      displayName: user?.displayName,
      createdAt:   user?.createdAt,
    },
    tasks:         userTasks,
    comments:      userComments,
    taskGroups:    userGroups,
    organizations: userMemberships.map((m) => ({
      id:       m.org.id,
      name:     m.org.name,
      slug:     m.org.slug,
      role:     m.role,
      joinedAt: m.joinedAt,
    })),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="paan-data-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}