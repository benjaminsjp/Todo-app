'use client'



import { useCallback, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Button } from '@/components/ui/button'

import { SquarePen, Trash2, X, Check } from 'lucide-react'

import { updateComment, deleteComment } from '@/lib/actions/comments'

import { CreateTaskEditor } from '@/components/CreateTask/CreateTaskEditor'

import { hasCommentEditorContent } from './commentEditorUtils'

import { useTaskListCheckboxPersistence } from '@/lib/hooks/useTaskListCheckboxPersistence'



type MappedComment = {

  id:                   number

  userId:               string

  content:              string

  createdAt:            string

  author:               string

  authorProfilePicture: string | undefined

}



type CommentProps = {

  comment:        MappedComment

  currentUserId?: string

}



export function Comment({ comment, currentUserId }: CommentProps) {

  const router = useRouter()

  const [isEditing,  setIsEditing]  = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  const [isSaving,   setIsSaving]   = useState(false)

  const [error,      setError]      = useState<string | null>(null)

  const [content,    setContent]    = useState(comment.content)



  const isAuthor = Boolean(currentUserId && currentUserId === comment.userId)

  const canToggleTaskList = isAuthor && !isEditing



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

  }, [comment.id, syncFromSaved])



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



    if ('error' in result) { setError(result.error); return }

    syncFromSaved(content)

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



  return (

    <div className="rounded-xl p-4 bg-surface-2 flex flex-col group">

      <div className="flex items-center gap-2 mb-2">

        <Avatar>

          <AvatarImage src={comment.authorProfilePicture || undefined} alt={comment.author} />

          <AvatarFallback>{comment.author[0]}</AvatarFallback>

        </Avatar>

        <span className="text-base font-semibold text-primary">{comment.author}</span>

        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>



        {!isEditing && isAuthor && (

          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

            <Button

              variant="ghost"

              size="icon-sm"

              onClick={() => void handleStartEditing()}

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

              onClick={() => void handleSave()}

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

            <CreateTaskEditor

              content={content}

              onChange={setContent}

              placeholder="Rediger kommentar..."

              editorClassName="min-h-24 prose-sm"

            />

          </div>

          {error && <p className="text-xs text-destructive mt-2">{error}</p>}

        </div>

      ) : (

        <div

          className="pl-10 prose-headings:font-heading prose-headings:font-medium prose prose-sm max-w-none dark:prose-invert"

          onClick={handleViewClick}

          dangerouslySetInnerHTML={{ __html: content }}

        />

      )}

    </div>

  )

}

