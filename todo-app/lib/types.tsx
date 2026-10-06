export type User = {
  id:          string
  displayName: string | null
  avatarUrl:   string | null
  email:       string
}

export type CommentReaction = {
  id:        number
  commentId: number
  userId:    string
  type:      string
  createdAt: Date | null
  user?:     User | null
}

export type Comment = {
  id:           number
  content:      string
  createdAt:    Date | null
  userId:       string
  taskId:       number
  parentId?:    number | null
  inReplyToId?: number | null
  pinnedAt?:    Date | null
  updatedAt:    Date | null
  user?:        User | null
  reactions?:   CommentReaction[]
}

export type MappedCommentReplyTarget = {
  id:      number
  author:  string
  snippet: string
}

export type Status = {
  id:    number
  label: string
  color: string
  icon?: string | null
  order: number
}


export type TaskGroup = {
  id:        number
  title:     string
  color:     string
  tasks?:    Task[]
  taskCount?: number
  createdBy: string | null
  orgId:     number | null
  createdAt: Date | null
}

export type Task = {
  id:          number
  title:       string
  description: string | null
  slug:        string
  startAt:     Date | null
  endAt:       Date | null
  deadlinePriority?: boolean
  statusId:    number | null
  groupId:     number | null
  orgId:       number | null
  createdBy:   string | null
  createdAt:   Date | null
  updatedAt:   Date | null
  order?:      number
  group?:      TaskGroup | null
  status?:     Status | null
  assignees?:  User[]
  comments?:   Comment[]
  commentCount?: number
}

export type Org = {
  id: number; name: string; slug: string
  role?: string
  tasks?: Task[]; groups?: TaskGroup[]
  statuses?: Status[]
}

// Hjelpefunksjoner som brukes på tvers av komponenter
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('no-NO', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

export type MappedCommentReactionUser = {
  id:        string
  name:      string
  avatarUrl?: string
}

export type MappedCommentReaction = {
  type:     string
  count:    number
  reacted:  boolean
  users:    MappedCommentReactionUser[]
}

export type MappedComment = {
  id:                   number
  userId:               string
  content:              string
  createdAt:            string
  author:               string
  authorProfilePicture: string | undefined
  parentId:             number | null
  pinned:               boolean
  reactions:            MappedCommentReaction[]
  replyTo?:             MappedCommentReplyTarget
  replies:              MappedComment[]
}

const REPLY_SNIPPET_MAX = 96

function replySnippet(html: string) {
  const text = stripHtml(html)
  if (!text) return '…'
  if (text.length <= REPLY_SNIPPET_MAX) return text
  return `${text.slice(0, REPLY_SNIPPET_MAX)}…`
}

function replyTargetForComment(
  c: Comment,
  byId: Map<number, Comment>,
): MappedCommentReplyTarget | undefined {
  if (c.parentId == null) return undefined

  const targetId = c.inReplyToId ?? c.parentId
  const target = byId.get(targetId)
  if (!target) return undefined

  return {
    id:      target.id,
    author:  target.user?.displayName ?? target.user?.email ?? 'Ukjent',
    snippet: replySnippet(target.content),
  }
}

function reactionUserLabel(user: User | null | undefined) {
  return user?.displayName ?? user?.email ?? 'Ukjent'
}

function aggregateReactions(
  reactions: CommentReaction[] = [],
  currentUserId?: string,
): MappedCommentReaction[] {
  const byType = new Map<string, MappedCommentReaction>()

  for (const reaction of reactions) {
    const user: MappedCommentReactionUser = {
      id:        reaction.userId,
      name:      reactionUserLabel(reaction.user),
      avatarUrl: reaction.user?.avatarUrl ?? undefined,
    }
    const existing = byType.get(reaction.type)
    if (existing) {
      existing.count += 1
      if (!existing.users.some((u) => u.id === user.id)) existing.users.push(user)
      if (currentUserId && reaction.userId === currentUserId) existing.reacted = true
      continue
    }
    byType.set(reaction.type, {
      type:    reaction.type,
      count:   1,
      reacted: Boolean(currentUserId && reaction.userId === currentUserId),
      users:   [user],
    })
  }

  return Array.from(byType.values()).sort((a, b) => a.type.localeCompare(b.type))
}

function toMappedComment(c: Comment, currentUserId?: string): Omit<MappedComment, 'replies' | 'replyTo'> {
  return {
    id:                   c.id,
    userId:               c.userId,
    content:              c.content,
    createdAt:            formatDate(c.createdAt),
    author:               c.user?.displayName ?? c.user?.email ?? 'Ukjent',
    authorProfilePicture: c.user?.avatarUrl ?? undefined,
    parentId:             c.parentId ?? null,
    pinned:               Boolean(c.pinnedAt),
    reactions:            aggregateReactions(c.reactions, currentUserId),
  }
}

/** Flat comments → threaded list with pinned roots first. */
export function mapComments(comments: Comment[] = [], currentUserId?: string): MappedComment[] {
  const roots: MappedComment[] = []
  const repliesByParent = new Map<number, MappedComment[]>()

  const sorted = [...comments].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return aTime - bTime
  })

  const byId = new Map(sorted.map((c) => [c.id, c]))

  for (const c of sorted) {
    const mapped: MappedComment = {
      ...toMappedComment(c, currentUserId),
      replyTo: replyTargetForComment(c, byId),
      replies: [],
    }
    if (c.parentId == null) {
      roots.push(mapped)
      continue
    }
    const list = repliesByParent.get(c.parentId) ?? []
    list.push(mapped)
    repliesByParent.set(c.parentId, list)
  }

  for (const root of roots) {
    root.replies = repliesByParent.get(root.id) ?? []
  }

  roots.sort((a, b) => Number(b.pinned) - Number(a.pinned))
  return roots
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export const colorMap: Record<string, { bg: string; border: string; text: string, opacity: string }> = {
  'bg-pink-500':   { bg: 'bg-pink-500',   border: 'border-pink-500',   text: 'text-pink-500', opacity: 'bg-pink-500/20' },
  'bg-purple-500': { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', opacity: 'bg-purple-500/20' },
  'bg-blue-500':   { bg: 'bg-blue-500',   border: 'border-blue-500',   text: 'text-blue-500', opacity: 'bg-blue-500/20' },
  'bg-green-500':  { bg: 'bg-green-500',  border: 'border-green-500',  text: 'text-green-500', opacity: 'bg-green-500/20' },
  'bg-orange-500': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', opacity: 'bg-orange-500/20' },
  'bg-red-500':    { bg: 'bg-red-500',    border: 'border-red-500',    text: 'text-red-500', opacity: 'bg-red-500/20' },
  'bg-yellow-500': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', opacity: 'bg-yellow-500/20' },
  'bg-gray-500':   { bg: 'bg-gray-500',   border: 'border-gray-500',   text: 'text-gray-500', opacity: 'bg-gray-500/20' },
}

export function getColor(bg: string) {
  return colorMap[bg] ?? colorMap['bg-gray-500']
}

export type StatusOption = {
  value: string
  label: string
  color: string
}

export type AssigneeOption = {
  value:     string
  label:     string
  avatarUrl?: string | null
}
export type StatusSelectProps = {
  value: string
  onChange: (value: string) => void
  options?: StatusOption[]
  className?: string
}
