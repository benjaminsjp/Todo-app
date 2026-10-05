'use client'

import { useRef, useState } from 'react'
import { createCommentForTask } from '@/lib/actions/comments'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { MessageCircle } from 'lucide-react'
import { CreateTaskEditor } from '@/components/CreateTask/CreateTaskEditor'
import { Comment } from './Comment'
import { hasCommentEditorContent } from './commentEditorUtils'
import type { Comment as CommentType } from '@/lib/types'

type MappedComment = {
  id:                   number
  userId:               string
  content:              string
  createdAt:            string
  author:               string
  authorProfilePicture: string | undefined
}

interface CommentsProps {
  taskId:              number
  comments?:           MappedComment[]
  currentUserId?:      string
  canEdit?:            boolean
  onOptimisticAdd?:    (comment: CommentType) => void
  onOptimisticRemove?: (tempId: number) => void
  onCommentSaved?:     (tempId: number, comment: CommentType) => void
}

export default function Comments({
  taskId,
  comments = [],
  currentUserId,
  canEdit = true,
  onOptimisticAdd,
  onOptimisticRemove,
  onCommentSaved,
}: CommentsProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const editorKey = useRef(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasCommentEditorContent(content) || isPending) return

    setError(null)
    setIsPending(true)

    const tempId = -Date.now()
    const optimistic: CommentType = {
      id:        tempId,
      content,
      createdAt: new Date(),
      updatedAt: null,
      taskId,
      userId:    '',
      user:      null,
    }
    onOptimisticAdd?.(optimistic)

    const result = await createCommentForTask(taskId, content)
    setIsPending(false)

    if ('error' in result) {
      onOptimisticRemove?.(tempId)
      setError(result.error)
      return
    }

    onCommentSaved?.(tempId, result.comment)
    setContent('')
    editorKey.current += 1
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-heading mt-8 mb-4">Kommentarer</h2>

      <div className="flex flex-col gap-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Ingen kommentarer ennå.</p>
        )}
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            canEdit={canEdit}
          />
        ))}
      </div>

      <div className="mt-auto pt-12 pb-12">
        <form onSubmit={handleSubmit}>
          <InputGroup className="bg-surface-2 border-border">
            <div className="px-4 py-3 w-full">
              <CreateTaskEditor
                key={editorKey.current}
                content={content}
                onChange={setContent}
                placeholder="Skriv en kommentar..."
                editorClassName="min-h-24 prose-sm"
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
                >
                  <MessageCircle /> {isPending ? 'Sender...' : 'Legg til kommentar'}
                </InputGroupButton>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </div>
  )
}
