'use client'

import { useRef, useState } from 'react'
import { createCommentForTask } from '@/lib/actions/comments'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { ChevronDown, ChevronUp, MessageCircle, X } from 'lucide-react'
import { CreateTaskEditor } from '@/components/CreateTask/CreateTaskEditor'
import { Comment } from './Comment'
import { hasCommentEditorContent } from './commentEditorUtils'
import { COMMENT_COMPOSER_CLASS } from './composerStyles'
import type { Comment as CommentType, MappedComment, User } from '@/lib/types'

const REPLY_PAGE_SIZE = 3

interface CommentsProps {
  taskId:              number
  comments?:           MappedComment[]
  currentUserId?:      string
  currentUser?:        User | null
  canEdit?:            boolean
  canModerate?:        boolean
  onOptimisticAdd?:    (comment: CommentType) => void
  onOptimisticRemove?: (tempId: number) => void
  onCommentSaved?:     (tempId: number, comment: CommentType) => void
  onCommentUpdated?:   (comment: CommentType) => void
  onCommentRemoved?:   (commentId: number) => void
}

export default function Comments({
  taskId,
  comments = [],
  currentUserId,
  currentUser,
  canEdit = true,
  canModerate = false,
  onOptimisticAdd,
  onOptimisticRemove,
  onCommentSaved,
  onCommentUpdated,
  onCommentRemoved,
}: CommentsProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [replyToId, setReplyToId] = useState<number | null>(null)
  const [visibleReplies, setVisibleReplies] = useState<Record<number, number>>({})
  const [composerFocusKey, setComposerFocusKey] = useState(0)
  const editorKey = useRef(0)
  const composerRef = useRef<HTMLDivElement>(null)

  const replyTarget = replyToId == null
    ? null
    : findComment(comments, replyToId)

  const handleReply = (commentId: number) => {
    setReplyToId(commentId)
    setComposerFocusKey((key) => key + 1)
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const revealRepliesForThread = (rootId: number, total: number) => {
    setVisibleReplies((prev) => {
      const current = prev[rootId] ?? 0
      const next = current === 0
        ? Math.min(REPLY_PAGE_SIZE, total)
        : Math.min(current + REPLY_PAGE_SIZE, total)
      return { ...prev, [rootId]: next }
    })
  }

  const hideRepliesForThread = (rootId: number) => {
    setVisibleReplies((prev) => ({ ...prev, [rootId]: 0 }))
  }

  const ensureRepliesVisible = (rootId: number, minimum: number) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [rootId]: Math.max(prev[rootId] ?? 0, minimum),
    }))
  }

  const submitComment = async () => {
    if (!hasCommentEditorContent(content) || isPending) return

    setError(null)
    setIsPending(true)

    // Match server: nest under root so one-level threads stay consistent.
    const replyTargetNow = replyToId == null ? null : findComment(comments, replyToId)
    const parentId = replyTargetNow
      ? (replyTargetNow.parentId ?? replyTargetNow.id)
      : replyToId
    const tempId = -Date.now()
    const optimistic: CommentType = {
      id:        tempId,
      content,
      createdAt: new Date(),
      updatedAt: null,
      taskId,
      userId:    '',
      parentId,
      pinnedAt:  null,
      reactions: [],
      user:      null,
    }
    onOptimisticAdd?.(optimistic)

    if (parentId != null) {
      const root = comments.find((c) => c.id === parentId)
      const nextTotal = (root?.replies.length ?? 0) + 1
      ensureRepliesVisible(parentId, nextTotal)
    }

    const result = await createCommentForTask(taskId, content, replyToId)
    setIsPending(false)

    if ('error' in result) {
      onOptimisticRemove?.(tempId)
      setError(result.error)
      return
    }

    onCommentSaved?.(tempId, result.comment)
    setContent('')
    setReplyToId(null)
    editorKey.current += 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitComment()
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-heading mt-8 mb-4">Kommentarer</h2>

      <div className="flex flex-col gap-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Ingen kommentarer ennå.</p>
        )}
        {comments.map((comment) => {
          const totalReplies = comment.replies.length
          const visibleCount = Math.min(visibleReplies[comment.id] ?? 0, totalReplies)
          const visible = comment.replies.slice(0, visibleCount)
          const remaining = totalReplies - visibleCount

          return (
            <div key={comment.id} className="flex flex-col gap-2">
              <Comment
                comment={comment}
                currentUserId={currentUserId}
                currentUser={currentUser}
                canEdit={canEdit}
                canModerate={canModerate}
                canPin
                depth={0}
                onReply={canEdit ? handleReply : undefined}
                onCommentUpdated={onCommentUpdated}
                onCommentRemoved={onCommentRemoved}
              />

              {totalReplies > 0 && (
                <div className="ml-6 sm:ml-10 flex flex-col gap-2">
                  {visibleCount > 0 && (
                    <div className="flex flex-col gap-2 border-l border-border/60 pl-3 sm:pl-4">
                      {visible.map((reply) => (
                        <Comment
                          key={reply.id}
                          comment={reply}
                          currentUserId={currentUserId}
                          currentUser={currentUser}
                          canEdit={canEdit}
                          canModerate={canModerate}
                          canPin={false}
                          depth={1}
                          onReply={canEdit ? handleReply : undefined}
                          onCommentUpdated={onCommentUpdated}
                          onCommentRemoved={onCommentRemoved}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1">
                    {remaining > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => revealRepliesForThread(comment.id, totalReplies)}
                      >
                        <ChevronDown className="size-3.5" />
                        {visibleCount === 0
                          ? `Vis svar (${totalReplies})`
                          : `Vis flere (${remaining})`}
                      </Button>
                    )}
                    {visibleCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => hideRepliesForThread(comment.id)}
                      >
                        <ChevronUp className="size-3.5" />
                        Skjul svar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canEdit && (
        <div ref={composerRef} className="mt-auto pt-12 pb-12">
          {replyTarget && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <p className="text-muted-foreground truncate">
                Svarer <span className="font-medium text-foreground">{replyTarget.author}</span>
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setReplyToId(null)}
                aria-label="Avbryt svar"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <InputGroup className={COMMENT_COMPOSER_CLASS}>
              <div className="px-4 py-3 w-full">
                <CreateTaskEditor
                  key={editorKey.current}
                  content={content}
                  onChange={setContent}
                  placeholder={
                    replyTarget
                      ? `Skriv et svar til ${replyTarget.author}...`
                      : 'Skriv en kommentar...'
                  }
                  editorClassName="min-h-24 prose-sm"
                  autoFocus={Boolean(replyTarget)}
                  focusKey={composerFocusKey}
                  onModEnter={() => { void submitComment() }}
                />
              </div>
              <InputGroupAddon align="block-end" className="border-t">
                {error && (
                  <p className="text-xs text-destructive px-2">{error}</p>
                )}
                <Button asChild className="ml-auto">
                  <InputGroupButton
                    type="submit"
                    size="sm"
                    variant="default"
                    disabled={isPending || !hasCommentEditorContent(content)}
                    title="Ctrl/⌘ + Enter"
                  >
                    <MessageCircle />
                    {isPending
                      ? 'Sender...'
                      : replyTarget
                        ? 'Send svar'
                        : 'Legg til kommentar'}
                  </InputGroupButton>
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
      )}
    </div>
  )
}

function findComment(
  comments: MappedComment[],
  id: number,
): MappedComment | null {
  for (const comment of comments) {
    if (comment.id === id) return comment
    for (const reply of comment.replies) {
      if (reply.id === id) return reply
    }
  }
  return null
}
