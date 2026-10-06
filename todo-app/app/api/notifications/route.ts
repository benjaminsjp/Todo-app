import { auth } from '@/lib/auth/server'
import { getPendingInvitationsForEmail, getUnreadNotificationsForUser } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

const TASK_NOTIFICATION_TYPES = new Set([
  'task_assigned',
  'comment_reply',
  'comment_reaction',
])

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session?.user) {
    return Response.json({ notifications: [] })
  }

  const [invites, userNotes] = await Promise.all([
    session.user.email
      ? getPendingInvitationsForEmail(session.user.email)
      : Promise.resolve([]),
    getUnreadNotificationsForUser(session.user.id),
  ])

  const notifications = [
    ...invites.map((inv) => ({
      id:        `invite-${inv.id}`,
      type:      'org_invitation' as const,
      token:     inv.token,
      orgName:   inv.org.name,
      orgSlug:   inv.org.slug,
      role:      inv.role,
      createdAt: inv.createdAt?.toISOString() ?? new Date().toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
    })),
    ...userNotes
      .filter((note) => TASK_NOTIFICATION_TYPES.has(note.type))
      .map((note) => ({
        id:             `note-${note.id}`,
        type:           note.type as 'task_assigned' | 'comment_reply' | 'comment_reaction',
        notificationId: note.id,
        taskId:         note.taskId,
        taskTitle:      note.taskTitle ?? 'Oppgave',
        taskSlug:       note.taskSlug,
        orgSlug:        note.orgSlug,
        fromUserName:   note.fromUserName ?? 'Noen',
        createdAt:      note.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return Response.json({ notifications })
}
