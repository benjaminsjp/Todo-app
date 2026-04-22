import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { organizationMembers, taskPresence } from '@/lib/db/schema'
import { getStatusesForOrg, getTaskGroupsForOrg, getTasksForOrg } from '@/lib/db/queries'
import { and, eq, gt } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

async function requireOrgMember(userId: string, orgId: number) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)),
  })
  if (!membership) throw new Error('Unauthorized')
}

type PresencePayload = {
  taskId: number
  userId: string
  mode: string
  lastSeenAt: string
  user: { displayName: string | null; email: string; avatarUrl: string | null } | null
}

export async function GET(req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { orgId: orgIdRaw } = await ctx.params
  const orgId = Number(orgIdRaw)
  if (!orgId) return new Response('Invalid orgId', { status: 400 })

  try {
    await requireOrgMember(session.user.id, orgId)
  } catch {
    return new Response('Unauthorized', { status: 403 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false

      const sendRaw = (line: string) => {
        if (closed) return
        controller.enqueue(encoder.encode(line))
      }

      const send = (event: unknown) => {
        sendRaw(`data: ${JSON.stringify(event)}\n\n`)
      }

      const heartbeat = () => {
        // comment lines are valid SSE heartbeats
        sendRaw(`: keep-alive\n\n`)
      }

      const close = () => {
        if (closed) return
        closed = true
        controller.close()
      }

      if (req.signal) req.signal.addEventListener('abort', close)

      const loop = async () => {
        // initial "open" flush helps some proxies/browsers start streaming immediately
        heartbeat()

        while (!closed) {
          const now = new Date()

          try {
            const [tasksPayload, statuses, groups] = await Promise.all([
              getTasksForOrg(orgId),
              getStatusesForOrg(orgId),
              getTaskGroupsForOrg(orgId),
            ])

            let presence: PresencePayload[] = []
            try {
              const cutoff = new Date(Date.now() - 15_000)
              const presenceRows = await db.query.taskPresence.findMany({
                where: and(eq(taskPresence.orgId, orgId), gt(taskPresence.lastSeenAt, cutoff)),
                with: {
                  user: { columns: { displayName: true, email: true, avatarUrl: true } },
                },
              })

              presence = presenceRows.map((p) => ({
                taskId: p.taskId,
                userId: p.userId,
                mode: p.mode,
                lastSeenAt: (p.lastSeenAt ?? now).toISOString(),
                user: p.user
                  ? { displayName: p.user.displayName ?? null, email: p.user.email, avatarUrl: p.user.avatarUrl ?? null }
                  : null,
              }))
            } catch {
              // If presence table isn't migrated yet, keep tasks realtime working.
              presence = []
            }

            send({
              type: 'org:update',
              cursor: now.toISOString(),
              tasks: tasksPayload,
              statuses,
              taskGroups: groups,
              presence,
            })
          } catch {
            heartbeat()
          }

          // poll interval
          await new Promise((r) => setTimeout(r, 2000))
        }
      }

      void loop()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

