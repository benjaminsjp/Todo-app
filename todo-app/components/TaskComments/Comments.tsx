'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createComment } from '@/lib/actions/comments'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, SquarePen } from 'lucide-react'
import Editor from '@/components/TextEditor/TextEditor'

type MappedComment = {
  id:                   number
  content:              string
  createdAt:            string
  author:               string
  authorProfilePicture: string
}

interface CommentsProps {
  taskId:    number
  comments?: MappedComment[]
}

export default function Comments({ taskId, comments = [] }: CommentsProps) {
  const [content, setContent] = useState('')
  const [state, action, isPending] = useActionState(createComment, null)
  const editorKey = useRef(0)

  useEffect(() => {
    if (state && 'success' in state) {
      setContent('')
      editorKey.current += 1 // reset editor
    }
  }, [state])

  return (
    <div className="flex flex-col h-full animate-fade-up animate-once animate-duration-350">
      <h2 className="text-2xl font-heading mt-8 mb-4">Comments</h2>

      <div className="flex flex-col gap-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Ingen kommentarer enda.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl p-4 bg-surface-2 flex flex-col group">
            <div className="flex items-center gap-2 mb-2">
              <Avatar>
                <AvatarImage src={comment.authorProfilePicture} alt={comment.author} />
                <AvatarFallback>{comment.author[0]}</AvatarFallback>
              </Avatar>
              <span className="text-base font-semibold text-primary">{comment.author}</span>
              <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
              <Button variant="ghost" size="icon-sm" className="ml-auto opacity-0 group-hover:opacity-100">
                <SquarePen className="size-4" />
              </Button>
            </div>
            <div
              className="pl-10 prose-headings:font-heading prose-headings:font-medium prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          </div>
        ))}
      </div>

      <div className="mt-auto pt-12">
        <form  action={action}>
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="content" value={content} />
          <InputGroup className='bg-surface-2 border-border'>
            <Editor
              key={editorKey.current}
              content={content}
              onChange={setContent}
            />
            <InputGroupAddon align="block-end" className="border-t">
              {state && 'error' in state && (
                <p className="text-xs text-destructive px-2">{state.error}</p>
              )}
              <Button asChild className='ml-auto'>
                <InputGroupButton
                  type="submit"
                  size="sm"
                  variant="default"
                  disabled={isPending || !content.trim()}
                >
                  <MessageCircle /> {isPending ? 'Sender...' : 'Add comment'}
                </InputGroupButton>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </div>
  )
}