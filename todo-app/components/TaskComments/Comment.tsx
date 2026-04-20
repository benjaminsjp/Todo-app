'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SquarePen, Trash2, X, Check } from 'lucide-react'
import { updateComment, deleteComment } from '@/lib/actions/comments'
import { CreateTaskEditor } from '@/components/CreateTask/CreateTaskEditor'

type MappedComment = {
  id:                   number
  content:              string
  createdAt:            string
  author:               string
  authorProfilePicture: string
}

export function Comment({ comment }: { comment: MappedComment }) {
  const router = useRouter()
  const [isEditing,  setIsEditing]  = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving,   setIsSaving]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [content,    setContent]    = useState(comment.content)

  const handleSave = async () => {
    if (!content.trim()) return
    setIsSaving(true)
    setError(null)

    const result = await updateComment(comment.id, content)
    setIsSaving(false)

    if ('error' in result) { setError(result.error); return }
    setIsEditing(false)
    router.refresh()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteComment(comment.id)
    setIsDeleting(false)

    if ('error' in result) { setError(result.error); return }
    router.refresh()
  }

  const handleCancel = () => {
    setContent(comment.content)
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="rounded-xl p-4 bg-surface-2 flex flex-col group">
      <div className="flex items-center gap-2 mb-2">
        <Avatar>
          <AvatarImage src={comment.authorProfilePicture} alt={comment.author} />
          <AvatarFallback>{comment.author[0]}</AvatarFallback>
        </Avatar>
        <span className="text-base font-semibold text-primary">{comment.author}</span>
        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>

        {!isEditing && (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsEditing(true)}
            >
              <SquarePen className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}

        {isEditing && (
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Check className="size-4 text-green-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="pl-10">
          <div className="rounded-lg border border-input p-6">
             <CreateTaskEditor content={content} onChange={setContent} />
          </div>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
      ) : (
        <div
          className="pl-10 prose-headings:font-heading prose-headings:font-medium prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  )
}