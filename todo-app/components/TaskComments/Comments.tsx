'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import Editor from "@/components/TextEditor/TextEditor"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, SquarePen } from "lucide-react"
import { type Task } from "@/app/data/test-data"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type Comment = NonNullable<Task['comments']>[number]

interface CommentsProps {
  taskId: number
  comments?: Comment[]
}

export default function Comments({ taskId, comments = [] }: CommentsProps) {
  const [content, setContent] = useState('')

  const handleSubmit = () => {
    if (!content.trim()) return
    console.log('New comment for task', taskId, content)
    setContent('')
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-heading mt-8 mb-4">Comments</h2>
      <div className="flex flex-col gap-4">
        {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
        {comments.map(comment => (
          <div key={comment.id} className="rounded-xl p-4 bg-accent flex flex-col group">
            <div className="flex items-center gap-2 mb-2">
              <Avatar>
                <AvatarImage src={comment.authorProfilePicture} alt={comment.author} className="rounded-full" />
                <AvatarFallback>{comment.author[0]}</AvatarFallback>
              </Avatar>
              <span className="text-base font-semibold text-primary">{comment.author}</span>
              <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
              <Button variant="ghost" size="icon-sm" className="ml-auto opacity-0 group-hover:opacity-100">
                <SquarePen className="size-4" />
              </Button>
            </div>
            <p className="pl-10">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <InputGroup>
          <Editor content={content} onChange={setContent} />
          <InputGroupAddon align="block-end" className="border-t">
            <InputGroupButton
              size="sm"
              className="ml-auto bg-brand text-brand-foreground hover:bg-brand/90"
              variant="default"
              onClick={handleSubmit}
            >
              <MessageCircle /> Add comment
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  )
}