"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Pencil, Eye } from "lucide-react"
import { StatusOption } from "@/lib/types"
import Comments from "@/components/TaskComments/Comments"
import { CreateTaskEditor } from "@/components/CreateTask/CreateTaskEditor"
import { updateTask } from "@/lib/actions/tasks"
import { type Task, mapComments } from "@/lib/types"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { TaskSidebar } from "./TaskSidebar"

export default function TaskDetails({
  task,
  taskGroup,
  taskGroupOptions,
  statusOptions,
}: {
  task:             Task
  taskGroup:        string | undefined
  taskGroupOptions: StatusOption[]
  statusOptions:    StatusOption[]
}) {
  const router = useRouter()
  const [isEditing,       setIsEditing]   = useState(false)
  const [isSaving,        setIsSaving]    = useState(false)
  const [error,           setError]       = useState<string | null>(null)
  const [title,           setTitle]       = useState(task.title)
  const [description,     setDescription] = useState(task.description ?? '')
  const [status,          setStatus]      = useState(task.status?.label ?? 'Todo')
  const [assignedGroupId, setGroupId]     = useState(task.groupId ? String(task.groupId) : 'none')
  const [deadline,        setDeadline]    = useState<Date | undefined>(
    task.deadline ? new Date(task.deadline) : undefined
  )

  // Debounced save – 600ms etter siste endring
  const debouncedUpdate = useDebounce(
    async (data: Parameters<typeof updateTask>[1]) => {
      await updateTask(task.id, data)
      router.refresh()
    },
    600
  )

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

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    const match = statusOptions.find((o) => o.label === newStatus)
    if (match) debouncedUpdate({ statusId: Number(match.value) })
  }

  const handleGroupChange = (newGroupId: string) => {
    setGroupId(newGroupId)
    debouncedUpdate({ groupId: newGroupId === 'none' ? null : Number(newGroupId) })
  }

  const handleDeadlineChange = (date: Date | undefined) => {
    setDeadline(date)
    debouncedUpdate({ deadline: date ? date.toISOString().split('T')[0] : null })
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
                <p className="text-muted-foreground text-sm italic">No description yet.</p>
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
        <TaskSidebar
          mode={isEditing ? 'edit' : 'view'}
          status={status}
          deadline={deadline}
          groupId={assignedGroupId}
          createdAt={task.createdAt}
          updatedAt={task.updatedAt}
          statusOptions={taskGroupOptions}
          taskGroupOptions={taskGroupOptions}
          onStatusChange={handleStatusChange}
          onDeadlineChange={handleDeadlineChange}
          onGroupChange={handleGroupChange}
          onSave={isEditing ? handleSave : () => setIsEditing(true)}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      </div>
    </div>
  )
}