"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import StatusSelect, { type StatusOption } from "@/components/status-select/StatusSelect"
import Comments from "@/components/TaskComments/Comments"
import Editor from "@/components/TextEditor/TextEditor"

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
  const [status, setStatus]               = useState(task.status?.label ?? 'Todo')
  const [assignedTaskGroup, setTaskGroup] = useState(taskGroup ?? '')
  const [isEditing, setIsEditing]         = useState(false)
  const [description, setDescription]    = useState(task.description ?? '')

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main container mx-auto flex-1 flex flex-row">
        <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">
          <div className="flex gap-3 items-center">
            <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Lagre' : 'Edit task'}
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Sist redigert: {formatDate(task.updatedAt)}
            </span>
          </div>

          <h1 className="text-5xl font-medium text-center sm:text-left font-heading text-heading-strong mb-6">
            {task.title}
          </h1>

          {/* Description */}
          {isEditing ? (
            <div className="rounded-lg border border-input overflow-hidden">
              <Editor content={description} onChange={setDescription} />
            </div>
          ) : description ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="text-muted-foreground text-sm italic">Ingen beskrivelse enda.</p>
          )}

          <Comments taskId={task.id} comments={mapComments(task.comments)} />
        </div>

        {/* Sidebar – uendret */}
        <div className="flex flex-col gap-4 min-w-sm max-w-lg border-l px-8 py-12">
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