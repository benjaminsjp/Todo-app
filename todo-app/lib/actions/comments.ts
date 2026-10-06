'use server'

import { db } from '@/lib/db'
import {
  comments,
  commentReactions,
  organizationMembers,
  tasks,
  userNotifications,
  users,
} from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { and, eq, isNotNull } from 'drizzle-orm'
import { assertCanMutateTaskContent } from '@/lib/actions/taskAccess'
import { COMMENT_WITH } from '@/lib/db/commentQuery'
import { isCommentReactionType, type CommentReactionType } from '@/lib/commentReactions'
import { canManageOrg } from '@/lib/orgPermissions'

type LoadedComment = NonNullable<Awaited<ReturnType<typeof loadComment>>>

async function loadComment(commentId: number) {
  return db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: COMMENT_WITH,
  })
}

function revalidateCommentPaths() {
  revalidatePath('/tasks')
  revalidatePath('/tasks/[slug]', 'page')
  revalidatePath('/org/[slug]/[taskSlug]', 'page')
  revalidatePath('/api/notifications')
}

async function getSenderName(userId: string) {
  const sender = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { displayName: true, email: true },
  })
  return sender?.displayName ?? sender?.email ?? 'Noen'
}

async function notifyCommentAuthor(opts: {
  recipientUserId: string
  actorUserId: string
  type: 'comment_reply' | 'comment_reaction'
  taskId: number
}) {
  if (opts.recipientUserId === opts.actorUserId) return

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, opts.taskId),
    columns: { id: true, title: true, slug: true, orgId: true },
    with: { org: { columns: { slug: true } } },
  })
  if (!task) return

  await db.insert(userNotifications).values({
    userId:       opts.recipientUserId,
    type:         opts.type,
    taskId:       task.id,
    taskTitle:    task.title,
    taskSlug:     task.slug,
    orgSlug:      task.org?.slug ?? null,
    fromUserId:   opts.actorUserId,
    fromUserName: await getSenderName(opts.actorUserId),
  })
}

async function getOrgRoleForTask(userId: string, taskId: number) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    columns: { orgId: true },
  })
  if (!task?.orgId) return null

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, task.orgId),
      eq(organizationMembers.userId, userId),
    ),
    columns: { role: true },
  })
  return membership?.role ?? null
}

async function canModerateComments(userId: string, taskId: number) {
  const role = await getOrgRoleForTask(userId, taskId)
  return canManageOrg(role)
}

export async function createComment(
  _prev: { error: string } | { success: true; comment: LoadedComment } | null,
  formData: FormData,
): Promise<{ error: string } | { success: true; comment: LoadedComment }> {
  const taskId = Number(formData.get('taskId'))
  const content = formData.get('content') as string
  const parentRaw = formData.get('parentId')
  const parentId = parentRaw ? Number(parentRaw) : null
  return createCommentForTask(taskId, content, parentId && Number.isFinite(parentId) ? parentId : null)
}

export async function createCommentForTask(
  taskId: number,
  content: string,
  parentId: number | null = null,
): Promise<{ error: string } | { success: true; comment: LoadedComment }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    if (!content?.trim()) return { error: 'Kommentar kan ikke være tom' }
    if (!taskId) return { error: 'Task ID mangler' }

    try {
      await assertCanMutateTaskContent(session.user.id, taskId)
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ingen tilgang' }
    }

    let resolvedParentId: number | null = null
    let inReplyToId: number | null = null
    let parentAuthorId: string | null = null

    if (parentId != null) {
      const parent = await db.query.comments.findFirst({
        where: and(eq(comments.id, parentId), eq(comments.taskId, taskId)),
        columns: { id: true, userId: true, parentId: true },
      })
      if (!parent) return { error: 'Kommentaren du svarer på finnes ikke' }

      // Keep threads one level deep (Twitter-style under the root comment).
      resolvedParentId = parent.parentId ?? parent.id
      inReplyToId = parent.id
      parentAuthorId = parent.userId
    }

    const comment = await insertComment(
      taskId,
      content.trim(),
      session.user.id,
      resolvedParentId,
      inReplyToId,
    )
    if (!comment) return { error: 'Kunne ikke opprette kommentar' }

    if (parentAuthorId) {
      await notifyCommentAuthor({
        recipientUserId: parentAuthorId,
        actorUserId:     session.user.id,
        type:            'comment_reply',
        taskId,
      })
    }

    revalidateCommentPaths()
    return { success: true, comment }
  } catch (e) {
    console.error('createComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

async function insertComment(
  taskId: number,
  content: string,
  userId: string,
  parentId: number | null,
  inReplyToId: number | null = null,
) {
  const [inserted] = await db.insert(comments).values({
    content,
    taskId,
    userId,
    parentId,
    inReplyToId,
  }).returning()

  return loadComment(inserted.id)
}

export async function updateComment(
  commentId: number,
  content: string,
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    if (!content?.trim()) return { error: 'Kommentar kan ikke være tom' }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, userId: true, taskId: true },
    })
    if (!existing) return { error: 'Kommentar ikke funnet' }
    if (existing.userId !== session.user.id) {
      return { error: 'Du kan bare redigere egne kommentarer' }
    }

    try {
      await assertCanMutateTaskContent(session.user.id, existing.taskId)
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ingen tilgang' }
    }

    await db.update(comments)
      .set({ content, updatedAt: new Date() })
      .where(and(
        eq(comments.id, commentId),
        eq(comments.userId, session.user.id),
      ))

    revalidateCommentPaths()
    return { success: true }
  } catch (e) {
    console.error('updateComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function deleteComment(
  commentId: number,
): Promise<{ error: string } | { success: true }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, userId: true, taskId: true },
    })
    if (!existing) return { error: 'Kommentar ikke funnet' }

    const isAuthor = existing.userId === session.user.id
    const isModerator = !isAuthor && await canModerateComments(session.user.id, existing.taskId)

    if (!isAuthor && !isModerator) {
      return { error: 'Ingen tilgang til å slette denne kommentaren' }
    }

    if (isAuthor) {
      try {
        await assertCanMutateTaskContent(session.user.id, existing.taskId)
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Ingen tilgang' }
      }
    }

    await db.delete(comments).where(eq(comments.id, commentId))

    revalidateCommentPaths()
    return { success: true }
  } catch (e) {
    console.error('deleteComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function toggleCommentReaction(
  commentId: number,
  type: string,
): Promise<{ error: string } | { success: true; active: boolean; comment: LoadedComment }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }
    if (!isCommentReactionType(type)) return { error: 'Ugyldig reaksjon' }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, userId: true, taskId: true },
    })
    if (!existing) return { error: 'Kommentar ikke funnet' }

    try {
      await assertCanMutateTaskContent(session.user.id, existing.taskId)
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ingen tilgang' }
    }

    const reactionType = type as CommentReactionType
    const current = await db.query.commentReactions.findFirst({
      where: and(
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.userId, session.user.id),
        eq(commentReactions.type, reactionType),
      ),
    })

    let active = false
    if (current) {
      await db.delete(commentReactions).where(eq(commentReactions.id, current.id))
      active = false
    } else {
      await db.insert(commentReactions).values({
        commentId,
        userId: session.user.id,
        type: reactionType,
      })
      active = true
      await notifyCommentAuthor({
        recipientUserId: existing.userId,
        actorUserId:     session.user.id,
        type:            'comment_reaction',
        taskId:          existing.taskId,
      })
    }

    const comment = await loadComment(commentId)
    if (!comment) return { error: 'Kommentar ikke funnet' }

    revalidateCommentPaths()
    return { success: true, active, comment }
  } catch (e) {
    console.error('toggleCommentReaction feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}

export async function togglePinComment(
  commentId: number,
): Promise<{ error: string } | { success: true; pinned: boolean; comment: LoadedComment }> {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return { error: 'Ikke innlogget' }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, taskId: true, parentId: true, pinnedAt: true },
    })
    if (!existing) return { error: 'Kommentar ikke funnet' }
    if (existing.parentId != null) {
      return { error: 'Bare toppnivå-kommentarer kan pinnes' }
    }

    try {
      await assertCanMutateTaskContent(session.user.id, existing.taskId)
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ingen tilgang' }
    }

    const willPin = !existing.pinnedAt

    if (willPin) {
      // Only one pinned comment per task.
      await db.update(comments)
        .set({ pinnedAt: null })
        .where(and(
          eq(comments.taskId, existing.taskId),
          isNotNull(comments.pinnedAt),
        ))

      await db.update(comments)
        .set({ pinnedAt: new Date(), updatedAt: new Date() })
        .where(eq(comments.id, commentId))
    } else {
      await db.update(comments)
        .set({ pinnedAt: null, updatedAt: new Date() })
        .where(eq(comments.id, commentId))
    }

    const comment = await loadComment(commentId)
    if (!comment) return { error: 'Kommentar ikke funnet' }

    revalidateCommentPaths()
    return { success: true, pinned: willPin, comment }
  } catch (e) {
    console.error('togglePinComment feil:', e)
    return { error: e instanceof Error ? e.message : 'Noe gikk galt' }
  }
}
