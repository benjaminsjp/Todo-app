"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import StatusSelect, { type StatusOption } from "@/components/status-select/StatusSelect"
import { type Task } from "@/app/data/test-data"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"

import Editor from "@/components/TextEditor/TextEditor"

import { MessageCircle, SquarePen } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar"
import Comments from "@/components/TaskComments/Comments"

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
                    <Comments taskId={task.id} comments={task.comments} />
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