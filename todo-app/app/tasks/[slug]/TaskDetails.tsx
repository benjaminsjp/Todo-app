"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import StatusSelect, { type StatusOption } from "@/components/status-select/StatusSelect"
import { type Task } from "@/app/data/test-data"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

import Editor from "@/components/TextEditor/TextEditor"

import { ArrowUp, MessageCircle } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TaskDetails({ 
    task,
    taskGroup,
    taskGroupOptions,
 }: { 
    task: Task
    taskGroup: string | undefined
    taskGroupOptions: StatusOption[]
  }) {
    
    const [status, setStatus] = useState(task.status)
    const [assignedTaskGroup, setTaskGroup] = useState(taskGroup ?? "")
    const [content, setContent] = useState('')

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main container mx-auto flex-1 flex flex-row">
                <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">
                    <div className="flex gap-3 items-center">
                        <Button variant={"secondary"}>Edit task</Button>
                        <span className="text-sm font-medium text-muted-foreground">
                            Last edited: {task.updatedAt}
                        </span>
                    </div>
                    <h1 className="text-5xl font-medium text-center sm:text-left font-heading text-heading-strong mb-6">
                        {task.title}
                    </h1>
                    <p>{task.description}</p>
                    <div>
                        <h2 className="text-2xl font-heading mt-8 mb-4">Comments</h2>
                        <div className="flex flex-col gap-4">
                            {task.comments?.map(comment => (
                                <div key={comment.id} className="rounded-xl p-4 bg-accent flex flex-col">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Avatar>
                                            <AvatarImage src={comment.authorProfilePicture} alt={comment.author} className="rounded-full" />
                                            <AvatarFallback>{comment.author[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold text-primary">{comment.author}</span>
                                        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                                    </div>
                                    <p className="pl-10">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-auto">
                        <InputGroup>
                            <Editor content={content} onChange={setContent} />
                            <InputGroupAddon align="block-end">
                                <InputGroupButton size="sm" className="ml-auto bg-brand text-brand-foreground hover:bg-brand/90" variant="default">
                                    <MessageCircle />Add comment 
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                </div>
                <div className="flex flex-col gap-4 min-w-sm max-w-lg border-l px-8 py-12">
                    <div className="flex items-center">
                        <span className="w-1/2">Status: </span>
                        <StatusSelect className="text-base" value={status} onChange={setStatus} />
                    </div>
                    <div className="flex items-center">
                        <span className="w-1/2">Created at: </span>
                        <p> {task.createdAt}</p>
                    </div>
                    <div className="flex items-center">
                        <span className="w-1/2">Deadline: </span>
                        <p> {task.deadline}</p>
                    </div>
                    <div className="flex items-center">
                        <span className="w-1/2">Task group: </span>
                        <StatusSelect
                            className="text-base"
                            value={assignedTaskGroup}
                            onChange={setTaskGroup}
                            options={taskGroupOptions}
                        />
                    </div>
                    
                </div>
            </div>
        </div>
    )
}