"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Pencil, Eye } from "lucide-react"
import { StatusOption } from "@/lib/types"
import Comments from "@/components/TaskComments/Comments"
import { CreateTaskEditor } from "@/components/CreateTask/CreateTaskEditor"
import { acquireTaskLock, releaseTaskLock, updateTask } from "@/lib/actions/tasks"
import { type Task, mapComments, Status, type Comment, type User } from "@/lib/types"
import { TaskSidebar } from "./TaskSidebar"
import { useOrgRealtime } from "@/lib/hooks/useOrgRealtime"
import { useTaskPresence } from "@/lib/hooks/useTaskPresence"
import { TaskRevisionHistory } from "./TaskRevisionHistory"

const CHECKBOX_SAVE_DEBOUNCE_MS = 450

function toggleTaskListCheckbox(html: string, checkboxIndex: number): string | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const docBoxes = Array.from(doc.querySelectorAll('ul[data-type="taskList"] input[type="checkbox"]'))
  const docInput = docBoxes[checkboxIndex] as HTMLInputElement | undefined
  if (!docInput) return null

  const docLi = docInput.closest('li')
  const nextChecked = docLi?.getAttribute('data-checked') !== 'true'
  if (docLi) docLi.setAttribute('data-checked', nextChecked ? 'true' : 'false')
  docInput.checked = nextChecked
  if (nextChecked) docInput.setAttribute('checked', '')
  else docInput.removeAttribute('checked')

  return doc.body.innerHTML
}

function commentsEqual(a: Comment[], b: Comment[]): boolean {
  if (a.length !== b.length) return false
  return a.every((c, i) => {
    const d = b[i]
    return c.id === d.id && c.content === d.content && String(c.updatedAt) === String(d.updatedAt)
  })
}

export default function TaskDetails({
  task,
  taskGroup,
  taskGroupOptions,
  statusOptions,
  statuses,
  currentUserId,
  currentUser,
}: {
  task:             Task
  taskGroup:        string | undefined
  taskGroupOptions: StatusOption[]
  statusOptions:    StatusOption[]
  statuses:         Status[]
  currentUserId?:   string
  currentUser?:     User | null
}) {
  const router = useRouter()
  const [isEditing,       setIsEditing]   = useState(false)
  const [isSaving,        setIsSaving]    = useState(false)
  const [error,           setError]       = useState<string | null>(null)
  const [title,           setTitle]       = useState(task.title)
  const [description,     setDescription] = useState(task.description ?? '')
  const [liveComments,    setLiveComments] = useState(task.comments ?? [])
  const [status,          setStatus]      = useState(task.status?.label ?? 'Todo')
  const [assignedGroupId, setGroupId]     = useState(task.groupId ? String(task.groupId) : 'none')
  const [deadline,        setDeadline]    = useState<Date | undefined>(
    task.deadline ? new Date(task.deadline) : undefined
  )

  const descriptionRef = useRef(task.description ?? '')
  const lastSavedDescriptionRef = useRef(task.description ?? '')
  const checkboxDirtyRef = useRef(false)
  const checkboxSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orgRealtime = useOrgRealtime(task.orgId ?? undefined)
  const editingUsers = (orgRealtime.presenceByTaskId.get(task.id) ?? [])
  .filter((p) => p.userId !== currentUserId && p.mode === 'editing')
  const isLockedByOther = Boolean(task.orgId) && editingUsers.length > 0

  useTaskPresence({
    orgId: task.orgId,
    taskId: task.id,
    enabled: Boolean(task.orgId),
    mode: isEditing ? 'editing' : 'viewing',
  })
  
  useEffect(() => {
    if (isLockedByOther && isEditing) {
      setIsEditing(false)
    }
  }, [isLockedByOther, isEditing])

  const flushCheckboxSave = useCallback(async () => {
    const nextHtml = descriptionRef.current
    if (nextHtml === lastSavedDescriptionRef.current) {
      checkboxDirtyRef.current = false
      return
    }

    const snapshot = lastSavedDescriptionRef.current
    const result = await updateTask(task.id, { description: nextHtml })

    if ('error' in result) {
      checkboxDirtyRef.current = false
      descriptionRef.current = snapshot
      setDescription(snapshot)
      setError(result.error)
      return
    }

    lastSavedDescriptionRef.current = nextHtml
    checkboxDirtyRef.current = false
  }, [task.id])

  const scheduleCheckboxSave = useCallback(() => {
    checkboxDirtyRef.current = true
    if (checkboxSaveTimerRef.current) clearTimeout(checkboxSaveTimerRef.current)
    checkboxSaveTimerRef.current = setTimeout(() => {
      checkboxSaveTimerRef.current = null
      void flushCheckboxSave()
    }, CHECKBOX_SAVE_DEBOUNCE_MS)
  }, [flushCheckboxSave])

  useEffect(() => {
    return () => {
      if (!checkboxSaveTimerRef.current) return
      clearTimeout(checkboxSaveTimerRef.current)
      checkboxSaveTimerRef.current = null
      void flushCheckboxSave()
    }
  }, [flushCheckboxSave])

  // Realtime: update this task's visible fields after other users save (org tasks only).
  useEffect(() => {
    if (!task.orgId) return
    if (isEditing) return
    if (!orgRealtime.tasks) return

    const updated = orgRealtime.tasks.find((t) => t.id === task.id)
    if (!updated) return

    setTitle((prev) => (prev === updated.title ? prev : updated.title))
    if (!checkboxDirtyRef.current) {
      const nextDesc = updated.description ?? ''
      if (nextDesc !== descriptionRef.current) {
        setDescription(nextDesc)
        descriptionRef.current = nextDesc
        lastSavedDescriptionRef.current = nextDesc
      }
    }
    setLiveComments((prev) => {
      const next = updated.comments ?? []
      return commentsEqual(prev, next) ? prev : next
    })
    setStatus((prev) => (prev === (updated.status?.label ?? 'Todo') ? prev : updated.status?.label ?? 'Todo'))
    setGroupId((prev) => {
      const next = updated.groupId ? String(updated.groupId) : 'none'
      return prev === next ? prev : next
    })
    setDeadline((prev) => {
      const next = updated.deadline ? new Date(updated.deadline) : undefined
      const prevTime = prev?.getTime()
      const nextTime = next?.getTime()
      return prevTime === nextTime ? prev : next
    })
  }, [task.id, task.orgId, isEditing, orgRealtime.tasks])

  useEffect(() => {
    if (isEditing || checkboxDirtyRef.current) return
    const next = task.description ?? ''
    if (next !== descriptionRef.current) {
      setDescription(next)
      descriptionRef.current = next
      lastSavedDescriptionRef.current = next
    }
  }, [task.description, isEditing])

  const handleDescriptionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Allow checking/unchecking task list items without entering "edit" mode.
    if (isEditing) return
    const target = e.target as HTMLElement | null
    if (!target) return

    // Make the entire task-list row clickable (not only the checkbox).
    const li = target.closest?.('ul[data-type="taskList"] li') as HTMLLIElement | null
    if (!li) return

    // Don't interfere with links inside the description.
    if (target.closest?.('a[href]')) return

    const root = e.currentTarget
    const boxes = Array.from(root.querySelectorAll('ul[data-type="taskList"] input[type="checkbox"]'))
    const input = li.querySelector?.('input[type="checkbox"]') as HTMLInputElement | null
    if (!input) return

    const idx = boxes.indexOf(input)
    if (idx < 0) return

    e.preventDefault()

    const nextHtml = toggleTaskListCheckbox(descriptionRef.current, idx)
    if (nextHtml === null) return

    setError(null)
    descriptionRef.current = nextHtml
    setDescription(nextHtml)
    scheduleCheckboxSave()
  }

  const handleSave = async () => {
    if (checkboxSaveTimerRef.current) {
      clearTimeout(checkboxSaveTimerRef.current)
      checkboxSaveTimerRef.current = null
      await flushCheckboxSave()
    }
    setIsSaving(true)
    setError(null)
    const statusMatch = statuses.find((s) => s.label === status)
    const result = await updateTask(task.id, {
      title,
      description,
      statusId: statusMatch?.id ?? null,
      groupId: assignedGroupId === 'none' ? null : Number(assignedGroupId),
      deadline: deadline ? deadline.toISOString().split('T')[0] : null,
    })
    setIsSaving(false)
    if ('error' in result) { setError(result.error); return }
    lastSavedDescriptionRef.current = description
    descriptionRef.current = description
    checkboxDirtyRef.current = false
    setIsEditing(false)
    await releaseTaskLock(task.id)
    router.refresh()
  }

  const handleCancel = () => {
    if (checkboxSaveTimerRef.current) {
      clearTimeout(checkboxSaveTimerRef.current)
      checkboxSaveTimerRef.current = null
    }
    checkboxDirtyRef.current = false
    const next = task.description ?? ''
    setTitle(task.title)
    setDescription(next)
    descriptionRef.current = next
    lastSavedDescriptionRef.current = next
    setStatus(task.status?.label ?? 'Todo')
    setGroupId(task.groupId ? String(task.groupId) : 'none')
    setDeadline(task.deadline ? new Date(task.deadline) : undefined)
    setIsEditing(false)
    setError(null)
    void releaseTaskLock(task.id)
  }

  const handleStartEditing = async () => {
    setError(null)
    if (checkboxSaveTimerRef.current) {
      clearTimeout(checkboxSaveTimerRef.current)
      checkboxSaveTimerRef.current = null
      await flushCheckboxSave()
    }
    if (!task.orgId) { setIsEditing(true); return }

    const res = await acquireTaskLock(task.id)
    if ('error' in res) { setError(res.error ?? null); return }
    if (res.success === false) {
      const who = res.lockedBy?.displayName ?? res.lockedBy?.email ?? 'another user'
      setError(`Task is currently locked (being edited by ${who}).`)
      return
    }
    setIsEditing(true)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
  }

  const handleGroupChange = (newGroupId: string) => {
    setGroupId(newGroupId)
  }

  const handleDeadlineChange = (date: Date | undefined) => {
    setDeadline(date)
  }

  const handleOptimisticCommentAdd = (comment: Comment) => {
    const withUser: Comment = {
      ...comment,
      userId: currentUserId ?? comment.userId,
      user:   currentUser ?? comment.user ?? null,
    }
    setLiveComments((prev) => [...prev, withUser])
  }

  const handleOptimisticCommentRemove = (tempId: number) => {
    setLiveComments((prev) => prev.filter((c) => c.id !== tempId))
  }

  const handleCommentSaved = (tempId: number, comment: Comment) => {
    setLiveComments((prev) =>
      prev.map((c) => (c.id === tempId ? comment : c))
    )
  }



  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="@container/main container mx-auto flex-1 min-h-0 flex flex-row overflow-hidden">

        {/* Hovedinnhold */}
        <div className="flex flex-1 min-h-0 overflow-y-auto">
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
              {editingUsers.length > 0 && (
                <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                  This task is being edited by {editingUsers.map((u) => u.user?.displayName ?? u.user?.email ?? 'Someone').join(', ')}.
                </div>
              )}
              <h1 className="text-5xl font-medium text-center sm:text-left font-heading text-heading-strong mb-6">
                {title}
              </h1>
              {description ? (
                <div
                  className="prose prose-headings:font-normal prose-headings:font-heading max-w-none dark:prose-invert"
                  onClick={handleDescriptionClick}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-muted-foreground text-sm italic">No description yet.</p>
              )}
              <Comments
                taskId={task.id}
                comments={mapComments(liveComments)}
                onOptimisticAdd={handleOptimisticCommentAdd}
                onOptimisticRemove={handleOptimisticCommentRemove}
                onCommentSaved={handleCommentSaved}
              />
            </>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
          </div>
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
          statuses={statuses}
          taskGroupOptions={taskGroupOptions}
          onStatusChange={isEditing ? handleStatusChange : undefined}
          onDeadlineChange={isEditing ? handleDeadlineChange : undefined}
          onGroupChange={isEditing ? handleGroupChange : undefined}
          onSave={isEditing ? handleSave : handleStartEditing}
          onCancel={handleCancel}
          isSaving={isSaving}
          headerSlot={<TaskRevisionHistory taskId={task.id} statuses={statuses} />}
        />
      </div>
    </div>
  )
}