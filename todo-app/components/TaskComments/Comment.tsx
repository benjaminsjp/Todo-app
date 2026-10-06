'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import {
  Check,
  MessageCircle,
  Pin,
  PinOff,
  SmilePlus,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import {
  deleteComment,
  toggleCommentReaction,
  togglePinComment,
  updateComment,
} from '@/lib/actions/comments'
import { CreateTaskEditor } from '@/components/CreateTask/CreateTaskEditor'
import { hasCommentEditorContent } from './commentEditorUtils'
import { useTaskListCheckboxPersistence } from '@/lib/hooks/useTaskListCheckboxPersistence'
import {
  COMMENT_REACTION_LABELS,
  type CommentReactionType,
} from '@/lib/commentReactions'
import { COMMENT_REACTION_ICONS, COMMENT_REACTION_TYPES } from './reactionIcons'
import type { MappedComment, User } from '@/lib/types'
import type { Comment as CommentType } from '@/lib/types'
import { cn } from '@/lib/utils'

type CommentProps = {
  comment:          MappedComment
  currentUserId?:   string
  currentUser?:     User | null
  canEdit?:         boolean
  canModerate?:     boolean
  canPin?:          boolean
  depth?:           number
  onReply?:         (commentId: number) => void
  onCommentUpdated?: (comment: CommentType) => void
  onCommentRemoved?: (commentId: number) => void
}

export function Comment({
  comment,
  currentUserId,
  currentUser,
  canEdit = true,
  canModerate = false,
  canPin = true,
  depth = 0,
  onReply,
  onCommentUpdated,
  onCommentRemoved,
}: CommentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPinning, setIsPinning] = useState(false)
  const [reactingType, setReactingType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState(comment.content)
  const [reactions, setReactions] = useState(comment.reactions)
  const [pinned, setPinned] = useState(comment.pinned)

  const isAuthor = Boolean(currentUserId && currentUserId === comment.userId)
  const canDelete = isAuthor || canModerate
  const canToggleTaskList = isAuthor && !isEditing
  const isReply = depth > 0

  const saveCommentHtml = useCallback(
    async (html: string) => {
      setError(null)
      return updateComment(comment.id, html)
    },
    [comment.id],
  )

  const {
    htmlRef,
    checkboxDirtyRef,
    syncFromSaved,
    handleTaskListClick,
    flushScheduledSave,
    cancelScheduledSave,
  } = useTaskListCheckboxPersistence({
    enabled: canToggleTaskList,
    onSave: saveCommentHtml,
    onRevertDisplay: setContent,
  })

  useEffect(() => {
    syncFromSaved(comment.content)
    setContent(comment.content)
    setReactions(comment.reactions)
    setPinned(comment.pinned)
  }, [comment.id, comment.reactions, comment.pinned, syncFromSaved])

  useEffect(() => {
    if (isEditing || checkboxDirtyRef.current) return
    syncFromSaved(comment.content)
    setContent(comment.content)
  }, [comment.content, isEditing, syncFromSaved, checkboxDirtyRef])

  const handleViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleTaskListClick(e, setContent)
  }

  const handleSave = async () => {
    await flushScheduledSave()
    if (!hasCommentEditorContent(content)) return
    setIsSaving(true)
    setError(null)

    htmlRef.current = content
    const result = await updateComment(comment.id, content)
    setIsSaving(false)

    if ('error' in result) {
      setError(result.error)
      return
    }
    syncFromSaved(content)
    setIsEditing(false)
    router.refresh()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteComment(comment.id)
    setIsDeleting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }
    onCommentRemoved?.(comment.id)
    router.refresh()
  }

  const handleCancel = () => {
    cancelScheduledSave()
    checkboxDirtyRef.current = false
    syncFromSaved(comment.content)
    setContent(comment.content)
    setIsEditing(false)
    setError(null)
  }

  const handleStartEditing = async () => {
    await flushScheduledSave()
    setIsEditing(true)
  }

  const handleToggleReaction = async (type: CommentReactionType) => {
    if (!canEdit) return
    setReactingType(type)
    setError(null)

    const me = currentUserId
      ? {
          id:        currentUserId,
          name:      currentUser?.displayName ?? currentUser?.email ?? 'Deg',
          avatarUrl: currentUser?.avatarUrl ?? undefined,
        }
      : null

    const prev = reactions
    const existing = prev.find((r) => r.type === type)
    const next = existing
      ? existing.reacted
        ? existing.count <= 1
          ? prev.filter((r) => r.type !== type)
          : prev.map((r) =>
              r.type === type
                ? {
                    ...r,
                    count: r.count - 1,
                    reacted: false,
                    users: me ? r.users.filter((u) => u.id !== me.id) : r.users,
                  }
                : r,
            )
        : prev.map((r) =>
            r.type === type
              ? {
                  ...r,
                  count: r.count + 1,
                  reacted: true,
                  users: me && !r.users.some((u) => u.id === me.id)
                    ? [...r.users, me]
                    : r.users,
                }
              : r,
          )
      : [...prev, {
          type,
          count: 1,
          reacted: true,
          users: me ? [me] : [],
        }]

    setReactions(next)

    const result = await toggleCommentReaction(comment.id, type)
    setReactingType(null)

    if ('error' in result) {
      setReactions(prev)
      setError(result.error)
      return
    }

    onCommentUpdated?.(result.comment)
    router.refresh()
  }

  const handleTogglePin = async () => {
    if (!canEdit || !canPin || isReply) return
    setIsPinning(true)
    setError(null)
    const result = await togglePinComment(comment.id)
    setIsPinning(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    setPinned(result.pinned)
    onCommentUpdated?.(result.comment)
    router.refresh()
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 bg-surface-2 flex flex-col group',
        pinned && 'ring-1 ring-primary/25',
        isReply && 'bg-surface-2/70',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar>
          <AvatarImage src={comment.authorProfilePicture || undefined} alt={comment.author} />
          <AvatarFallback>{comment.author[0]}</AvatarFallback>
        </Avatar>
        <span className="text-base font-semibold text-primary">{comment.author}</span>
        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
        {pinned && (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Pin className="size-3" /> Festet
          </span>
        )}

        {!isEditing && (isAuthor || canDelete || (canEdit && canPin && !isReply)) && (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {canEdit && canPin && !isReply && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void handleTogglePin()}
                disabled={isPinning}
                aria-label={pinned ? 'Fjern feste' : 'Fest kommentar'}
                title={pinned ? 'Fjern feste' : 'Fest kommentar'}
              >
                {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              </Button>
            )}
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void handleStartEditing()}
                aria-label="Rediger kommentar"
              >
                <SquarePen className="size-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                aria-label="Slett kommentar"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="pl-10">
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <p className="text-muted-foreground truncate">
              Redigerer <span className="font-medium text-foreground">kommentar</span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCancel}
              disabled={isSaving}
              aria-label="Avbryt redigering"
            >
              <X className="size-4" />
            </Button>
          </div>
          <InputGroup className="bg-background/60 border-border">
            <div className="px-4 py-3 w-full">
              <CreateTaskEditor
                content={content}
                onChange={setContent}
                placeholder="Rediger kommentaren din..."
                editorClassName="min-h-24 prose-sm"
              />
            </div>
            <InputGroupAddon align="block-end" className="border-t">
              {error && (
                <p className="text-xs text-destructive px-2">{error}</p>
              )}
              <Button asChild className="ml-auto">
                <InputGroupButton
                  type="button"
                  size="sm"
                  variant="default"
                  disabled={isSaving || !hasCommentEditorContent(content)}
                  onClick={() => void handleSave()}
                >
                  <Check />
                  {isSaving ? 'Lagrer...' : 'Lagre endringer'}
                </InputGroupButton>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
      ) : (
        <>
          <div
            className="pl-10 prose-headings:font-heading prose-headings:font-medium prose prose-sm max-w-none dark:prose-invert"
            onClick={handleViewClick}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <div className="pl-10 mt-3 flex flex-wrap items-center gap-1.5">
            {reactions.map((reaction) => {
              const type = reaction.type as CommentReactionType
              const Icon = COMMENT_REACTION_ICONS[type]
              if (!Icon) return null
              const label = COMMENT_REACTION_LABELS[type] ?? reaction.type
              return (
                <HoverCard key={reaction.type} openDelay={280} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      disabled={reactingType === reaction.type}
                      onClick={() => {
                        if (!canEdit) return
                        void handleToggleReaction(type)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                        reaction.reacted
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border bg-background/50 text-muted-foreground hover:text-foreground',
                        !canEdit && 'cursor-default',
                      )}
                      aria-label={`${label}${reaction.reacted ? ' (din)' : ''}`}
                    >
                      <Icon className="size-3.5" />
                      <span>{reaction.count}</span>
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-56 p-3" side="top" align="start">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{label}</p>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {reaction.count}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                      {reaction.users.map((user) => (
                        <li key={user.id} className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-6 shrink-0">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-[10px]">
                              {user.name[0]?.toUpperCase() ?? '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">
                            {user.id === currentUserId ? 'Deg' : user.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </HoverCardContent>
                </HoverCard>
              )
            })}

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    aria-label="Legg til reaksjon"
                  >
                    <SmilePlus className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="flex w-auto min-w-max flex-row gap-0.5 p-1.5"
                >
                  {COMMENT_REACTION_TYPES.map((type) => {
                    const Icon = COMMENT_REACTION_ICONS[type]
                    return (
                      <DropdownMenuItem
                        key={type}
                        className="size-9 justify-center p-0"
                        onClick={() => void handleToggleReaction(type)}
                        aria-label={COMMENT_REACTION_LABELS[type]}
                      >
                        <Icon className="size-4" />
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {canEdit && onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => onReply(comment.id)}
              >
                <MessageCircle className="size-3.5" />
                Svar
              </Button>
            )}
          </div>

          {error && <p className="pl-10 text-xs text-destructive mt-2">{error}</p>}
        </>
      )}
    </div>
  )
}
