import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizationMembers, taskPresence, tasks, users } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

function isMissingPresenceTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const anyErr = err as any
  const code = anyErr.code ?? anyErr.cause?.code
  if (code === '42P01') return true // undefined_table
  const msg = String(anyErr.message ?? anyErr.cause?.message ?? '')
  return msg.includes('relation "task_presence" does not exist')
}

async function requireOrgMember(userId: string, orgId: number) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)),
  })
  if (!membership) throw new Error('Ingen tilgang')
}

export async function POST(req: Request) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as null | {
    orgId: number
    taskId: number
    mode?: 'editing' | 'viewing'
  }
  if (!body?.orgId || !body?.taskId) return NextResponse.json({ error: 'Ugyldig forespørsel' }, { status: 400 })

  await requireOrgMember(session.user.id, body.orgId)

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, body.taskId), eq(tasks.orgId, body.orgId)),
  })
  if (!task) return NextResponse.json({ error: 'Oppgave ikke funnet' }, { status: 404 })

  try {
    await db.insert(taskPresence).values({
      orgId: body.orgId,
      taskId: body.taskId,
      userId: session.user.id,
      mode: body.mode ?? 'editing',
      lastSeenAt: new Date(),
    }).onConflictDoUpdate({
      target: [taskPresence.taskId, taskPresence.userId],
      set: { mode: body.mode ?? 'editing', lastSeenAt: new Date(), orgId: body.orgId },
    })
  } catch (e) {
    // In dev, you may not have run the migration yet.
    if (isMissingPresenceTableError(e)) {
      return NextResponse.json({ ok: false, missingMigration: true })
    }
    throw e
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })

  const url = new URL(req.url)
  const orgId = Number(url.searchParams.get('orgId'))
  const taskId = Number(url.searchParams.get('taskId'))
  if (!orgId || !taskId) return NextResponse.json({ error: 'Mangler orgId/taskId' }, { status: 400 })

  await requireOrgMember(session.user.id, orgId)

  try {
    await db.delete(taskPresence).where(and(
      eq(taskPresence.orgId, orgId),
      eq(taskPresence.taskId, taskId),
      eq(taskPresence.userId, session.user.id),
    ))
  } catch (e) {
    if (isMissingPresenceTableError(e)) {
      return NextResponse.json({ ok: false, missingMigration: true })
    }
    throw e
  }

  return NextResponse.json({ ok: true })
}

