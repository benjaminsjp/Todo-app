"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import StatusSelect, { type StatusOption } from "@/components/status-select/StatusSelect"
import Comments from "@/components/TaskComments/Comments"
import { CreateTaskEditor } from "@/components/CreateTask/CreateTaskEditor"
import { updateTask } from "@/lib/actions/tasks"
import { type Task, formatDate, mapComments } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Pencil, Eye } from "lucide-react"

export default function TaskDetails({
  task,
  taskGroup,
  taskGroupOptions,
}: {
  task:             Task
  taskGroup:        string | undefined
  taskGroupOptions: StatusOption[]
}) {
  const router = useRouter()
  const [isEditing,         setIsEditing]   = useState(false)
  const [isSaving,          setIsSaving]    = useState(false)
  const [error,             setError]       = useState<string | null>(null)
  const [title,             setTitle]       = useState(task.title)
  const [description,       setDescription] = useState(task.description ?? '')
  const [status,            setStatus]      = useState(task.status?.label ?? 'Todo')
  const [assignedGroupId,   setGroupId]     = useState(task.groupId ? String(task.groupId) : '')

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    const result = await updateTask(task.id, { title, description })

    setIsSaving(false)
    if ('error' in result) { setError(result.error); return }
    setIsEditing(false)
    router.refresh()
  }

  const handleCancel = () => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setIsEditing(false)
    setError(null)
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    const statusOption = taskGroupOptions.find((o) => o.value === newStatus)
    if (statusOption) {
      await updateTask(task.id, { statusId: Number(statusOption.value) })
    }
  }

  const handleGroupChange = async (newGroupId: string) => {
    setGroupId(newGroupId)
    await updateTask(task.id, { groupId: newGroupId ? Number(newGroupId) : null })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main container mx-auto flex-1 flex flex-row">

        {/* Hovedinnhold */}
        <div className="flex flex-1 flex-col gap-4 max-w-prose py-12 px-8 mx-auto">
          {isEditing ? (
            <>
              <Badge variant="secondary"><Pencil data-icon="inline-start" />Editing task</Badge>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-5xl font-medium text-center sm:text-left font-heading bg-transparent border-none outline-none placeholder:text-muted-foreground text-heading-strong mb-6 w-full"
              />
              <CreateTaskEditor content={description} onChange={setDescription} />
            </>
          ) : (
            <>
              <Badge variant="secondary"><Eye data-icon="inline-start" />Viewing</Badge>
              <h1 className="text-5xl font-medium text-center sm:text-left font-heading text-heading-strong mb-6">
                {title}
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

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 min-w-sm max-w-lg border-l px-8 py-12">
          <div className="flex gap-3 items-center">
            {isEditing ? (
              <>
                <Button variant="brand" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Lagrer...' : 'Lagre'}
                </Button>
                <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                  Avbryt
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Rediger
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  Sist redigert: {formatDate(task.updatedAt)}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center">
            <span className="w-1/2">Status:</span>
            <StatusSelect className="text-base" value={status} onChange={handleStatusChange} />
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
            <span className="w-1/2">Group:</span>
            <StatusSelect
              className="text-base"
              value={assignedGroupId}
              onChange={handleGroupChange}
              options={taskGroupOptions}
            />
          </div>
        </div>
      </div>
    </div>
  )
}