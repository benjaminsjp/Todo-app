"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import StatusSelect, { type StatusOption } from "@/components/status-select/StatusSelect"
import Comments from "@/components/TaskComments/Comments"
import { CreateTaskEditor } from "@/components/Kanban/CreateTaskEditor"
import Link from "next/link"
import { updateTask } from '@/lib/actions/tasks'
import { useActionState } from 'react'

type User = {
  id:          string
  displayName: string | null
  avatarUrl:   string | null
  email:       string
}

type Comment = {
  id:        number
  content:   string
  createdAt: Date | null
  userId:    string
  user?:     User | null
}

type Status = {
  id:    number
  label: string
  color: string
}

type TaskGroup = {
  id:    number
  title: string
  color: string
}

type Task = {
  id:          number
  title:       string
  description: string | null
  slug:        string
  deadline:    string | null
  createdAt:   Date | null
  updatedAt:   Date | null
  status?:     Status | null
  group?:      TaskGroup | null
  comments?:   Comment[]
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('no-NO', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}


// Mapper DB-kommentarer til formatet Comments-komponenten forventer
function mapComments(comments: Comment[] = []) {
  return comments.map((c) => ({
    id:                   c.id,
    content:              c.content,
    createdAt:            formatDate(c.createdAt),
    author:               c.user?.displayName ?? c.user?.email ?? 'Ukjent',
    authorProfilePicture: c.user?.avatarUrl ?? '',
  }))
}

export default function TaskDetails({ task, taskGroup, taskGroupOptions }: {
  task: Task
  taskGroup: string | undefined
  taskGroupOptions: StatusOption[]
}) {
  const router = useRouter()
  const [isEditing,  setIsEditing]  = useState(false)
  const [status,     setStatus]     = useState(task.status?.label ?? 'Todo')
  const [assignedTaskGroup, setTaskGroup] = useState(taskGroup ?? '')
  const [description, setDescription]    = useState(task.description ?? '')
  const [title,       setTitle]           = useState(task.title)

  const [state, action, isPending] = useActionState(updateTask, null)


  const handleSave = async () => {
    // TODO: koble til updateTask Server Action
    setIsEditing(false)
    router.refresh()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main container mx-auto flex-1 flex flex-row">

        {/* Hovedinnhold */}
        <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">
          {isEditing ? (
            // Redigeringsmodus – samme layout som CreateTaskForm
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-5xl font-medium text-center sm:text-left font-heading bg-transparent border-none outline-none placeholder:text-muted-foreground text-heading-strong mb-6 w-full"
              />
              <CreateTaskEditor content={description} onChange={setDescription} />
            </>
          ) : (
            // Visningsmodus
            <>
              <h1 className="text-5xl font-medium text-center sm:text-left font-heading text-heading-strong mb-6">
                {task.title}
              </h1>
              {description ? (
                <div
                  className="prose prose-headings:font-normal prose-headings:font-heading max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-muted-foreground text-sm italic">Ingen beskrivelse enda.</p>
              )}
              <Comments taskId={task.id} comments={mapComments(task.comments)} />
            </>
          )}

        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 min-w-sm max-w-lg border-l px-8 py-12">
          <div className="flex gap-3 items-center">
            {isEditing ? (
              <>
                <Button variant="brand" onClick={handleSave}>Lagre</Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Avbryt</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>Rediger</Button>
                <span className="text-sm font-medium text-muted-foreground">
                  Sist redigert: {formatDate(task.updatedAt)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-1/2">Status:</span>
            <StatusSelect className="text-base" value={status} onChange={setStatus} />
          </div>
          <div className="flex items-center">
            <span className="w-1/2">Opprettet:</span>
            <p>{formatDate(task.createdAt)}</p>
          </div>
          <div className="flex items-center">
            <span className="w-1/2">Deadline:</span>
            <p>{task.deadline ?? '–'}</p>
          </div>
          <div className="flex items-center">
            <span className="w-1/2">Gruppe:</span>
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
