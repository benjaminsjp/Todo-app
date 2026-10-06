"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { BackToBoardLink } from "@/components/BackToBoardLink"
import { AssigneeOption, StatusOption } from "@/lib/types"
import Comments from "@/components/TaskComments/Comments"
import { TaskTitleField } from "@/components/Task/TaskTitleField"
import { CreateTaskEditor } from "@/components/CreateTask/CreateTaskEditor"
import { acquireTaskLock, releaseTaskLock, updateTask, deleteTask } from "@/lib/actions/tasks"
import { type Task, mapComments, Status, type Comment, type User } from "@/lib/types"
import { TaskSidebar } from "./TaskSidebar"
import { useOrgRealtime } from "@/lib/hooks/useOrgRealtime"
import { useTaskPresence } from "@/lib/hooks/useTaskPresence"
import { TaskRevisionHistory } from "./TaskRevisionHistory"
import { parseTaskDateTime, serializeTaskDateTime } from '@/lib/taskSchedule'
import { DEFAULT_STATUS_LABELS } from '@/lib/statusDefaults'
import { usersFromAssigneeIds } from '@/lib/taskAssignees'
import { toast } from 'sonner'
import { toggleTaskListCheckbox } from '@/lib/tiptapTaskListHtml'

const CHECKBOX_SAVE_DEBOUNCE_MS = 450

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
  assigneeOptions,
  currentUserId,
  currentUser,
  boardHref,
  canEdit = true,
}: {
  task:             Task
  taskGroup:        string | undefined
  taskGroupOptions: StatusOption[]
  statusOptions:    StatusOption[]
  statuses:         Status[]
  assigneeOptions:  AssigneeOption[]
  currentUserId?:   string
  currentUser?:     User | null
  boardHref:        string
  canEdit?:         boolean
}) {
  const router = useRouter()
  const contentBoundaryRef = useRef<HTMLDivElement>(null)
  const [isEditing,       setIsEditing]   = useState(false)
  const [isSaving,        setIsSaving]    = useState(false)
  const [error,           setError]       = useState<string | null>(null)
  const [title,           setTitle]       = useState(task.title)
  const [description,     setDescription] = useState(task.description ?? '')
  const [liveComments,    setLiveComments] = useState(task.comments ?? [])
  const [status,          setStatus]      = useState(task.status?.label ?? DEFAULT_STATUS_LABELS.todo)
  const [assignedGroupId, setGroupId]     = useState(task.groupId ? String(task.groupId) : 'none')
  const [assigneeIds,     setAssigneeIds] = useState((task.assignees ?? []).map((user) => user.id))
  const [liveAssignees,   setLiveAssignees] = useState<User[]>(task.assignees ?? [])
  const [assigneesSaving, setAssigneesSaving] = useState(false)
  const [startAt,         setStartAt]      = useState<Date | undefined>(
    parseTaskDateTime(task.startAt),
  )
  const [endAt,           setEndAt]        = useState<Date | undefined>(
    parseTaskDateTime(task.endAt),
  )
  const [deadlinePriority, setDeadlinePriority] = useState(Boolean(task.deadlinePriority))

  const descriptionRef = useRef(task.description ?? '')
  const lastSavedDescriptionRef = useRef(task.description ?? '')
  const checkboxDirtyRef = useRef(false)
  const checkboxSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orgRealtime = useOrgRealtime(task.orgId ?? undefined)
  const editingUsers = (orgRealtime.presenceByTaskId.get(task.id) ?? [])
  .filter((p) => p.userId !== currentUserId && p.mode === 'editing')
  const isLockedByOther = Boolean(task.orgId) && editingUsers.length > 0

  useEffect(() => {
    setLiveAssignees(task.assignees ?? [])
  }, [task.assignees])

  useEffect(() => {
    if (task.comments === undefined) return
    setLiveComments((prev) => {
      const next = task.comments ?? []
      return commentsEqual(prev, next) ? prev : next
    })
  }, [task.comments])

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
      // Org realtime tasks omit comments (only commentCount) — do not wipe the list.
      if (updated.comments === undefined) return prev
      const next = updated.comments
      return commentsEqual(prev, next) ? prev : next
    })
    setStatus((prev) => (prev === (updated.status?.label ?? DEFAULT_STATUS_LABELS.todo) ? prev : updated.status?.label ?? DEFAULT_STATUS_LABELS.todo))
    setGroupId((prev) => {
      const next = updated.groupId ? String(updated.groupId) : 'none'
      return prev === next ? prev : next
    })
    setAssigneeIds((prev) => {
      const next = (updated.assignees ?? []).map((user) => user.id)
      if (prev.length === next.length && prev.every((id, index) => id === next[index])) return prev
      return next
    })
    setLiveAssignees((prev) => {
      const next = updated.assignees ?? []
      if (prev.length === next.length && prev.every((user, index) => user.id === next[index]?.id)) return prev
      return next
    })
    setStartAt((prev) => {
      const next = parseTaskDateTime(updated.startAt)
      const prevTime = prev?.getTime()
      const nextTime = next?.getTime()
      return prevTime === nextTime ? prev : next
    })
    setEndAt((prev) => {
      const next = parseTaskDateTime(updated.endAt)
      const prevTime = prev?.getTime()
      const nextTime = next?.getTime()
      return prevTime === nextTime ? prev : next
    })
    setDeadlinePriority(Boolean(updated.deadlinePriority))
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
    if (!canEdit || isEditing) return
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
      assigneeIds,
      startAt: serializeTaskDateTime(startAt),
      endAt: serializeTaskDateTime(endAt),
      deadlinePriority: Boolean(endAt) && deadlinePriority,
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
    setStatus(task.status?.label ?? DEFAULT_STATUS_LABELS.todo)
    setGroupId(task.groupId ? String(task.groupId) : 'none')
    setAssigneeIds((task.assignees ?? []).map((user) => user.id))
    setLiveAssignees(task.assignees ?? [])
    setStartAt(parseTaskDateTime(task.startAt))
    setEndAt(parseTaskDateTime(task.endAt))
    setDeadlinePriority(Boolean(task.deadlinePriority))
    setIsEditing(false)
    setError(null)
    void releaseTaskLock(task.id)
  }

  const handleStartEditing = async () => {
    if (!canEdit) return
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
      const who = res.lockedBy?.displayName ?? res.lockedBy?.email ?? 'en annen bruker'
      setError(`Oppgaven er låst (redigeres av ${who}).`)
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

  const handleStartChange = (date: Date | undefined) => {
    setStartAt(date)
  }

  const handleEndChange = (date: Date | undefined) => {
    setEndAt(date)
    if (!date) setDeadlinePriority(false)
  }

  const handleDeadlinePriorityChange = (value: boolean) => {
    setDeadlinePriority(value)
  }

  const handleAssigneesChangeLocal = useCallback((nextAssigneeIds: string[]) => {
    setAssigneeIds(nextAssigneeIds)
    setLiveAssignees(usersFromAssigneeIds(nextAssigneeIds, liveAssignees, assigneeOptions))
  }, [liveAssignees, assigneeOptions])

  const handleAssigneesChange = async (nextAssigneeIds: string[]) => {
    if (assigneesSaving) return

    const prevIds = assigneeIds
    const prevAssignees = liveAssignees

    setAssigneeIds(nextAssigneeIds)
    setLiveAssignees(usersFromAssigneeIds(nextAssigneeIds, liveAssignees, assigneeOptions))

    setAssigneesSaving(true)
    const result = await updateTask(task.id, { assigneeIds: nextAssigneeIds })
    setAssigneesSaving(false)

    if ('error' in result) {
      toast.error(result.error)
      setAssigneeIds(prevIds)
      setLiveAssignees(prevAssignees)
      return
    }

    router.refresh()
  }

  const saveMetadataPatch = async (
    patch: Parameters<typeof updateTask>[1],
    rollback: () => void,
  ) => {
    const result = await updateTask(task.id, patch)
    if ('error' in result) {
      toast.error(result.error)
      rollback()
      return false
    }
    router.refresh()
    return true
  }

  const handleStatusChangeView = async (newStatus: string) => {
    const prev = status
    setStatus(newStatus)
    const statusMatch = statuses.find((s) => s.label === newStatus)
    await saveMetadataPatch(
      { statusId: statusMatch?.id ?? null },
      () => setStatus(prev),
    )
  }

  const handleGroupChangeView = async (newGroupId: string) => {
    const prev = assignedGroupId
    setGroupId(newGroupId)
    await saveMetadataPatch(
      { groupId: newGroupId === 'none' ? null : Number(newGroupId) },
      () => setGroupId(prev),
    )
  }

  const handleScheduleCommitView = async () => {
    const snapshot = {
      start: parseTaskDateTime(task.startAt),
      end: parseTaskDateTime(task.endAt),
      priority: Boolean(task.deadlinePriority),
    }
    const prevStart = startAt
    const prevEnd = endAt
    const prevPriority = deadlinePriority

    const startTime = startAt?.getTime()
    const endTime = endAt?.getTime()
    const savedStart = snapshot.start?.getTime()
    const savedEnd = snapshot.end?.getTime()
    if (
      startTime === savedStart &&
      endTime === savedEnd &&
      deadlinePriority === snapshot.priority
    ) {
      return
    }

    await saveMetadataPatch(
      {
        startAt: serializeTaskDateTime(startAt),
        endAt: serializeTaskDateTime(endAt),
        deadlinePriority: Boolean(endAt) && deadlinePriority,
      },
      () => {
        setStartAt(prevStart)
        setEndAt(prevEnd)
        setDeadlinePriority(prevPriority)
      },
    )
  }

  const handleDeleteTask = async () => {
    const result = await deleteTask(task.id)
    if ('error' in result) {
      toast.error(result.error)
      return { error: result.error }
    }
    toast.success('Oppgaven ble slettet')
    router.push(boardHref)
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
        <div ref={contentBoundaryRef} className="flex flex-1 min-h-0 overflow-y-auto py-12">
          <div className="flex flex-1 flex-col gap-4 max-w-prose px-8 mx-auto">
          {isEditing ? (
            <Badge variant="secondary" className="w-fit">
              <Pencil data-icon="inline-start" />
              Redigerer oppgave
            </Badge>
          ) : (
            <BackToBoardLink href={boardHref} />
          )}
          {isEditing ? (
            <>
              <TaskTitleField value={title} onChange={setTitle} />
              <CreateTaskEditor
                content={description}
                onChange={setDescription}
                boundaryRef={contentBoundaryRef}
              />
            </>
          ) : (
            <>
              {editingUsers.length > 0 && (
                <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                  Denne oppgaven redigeres av {editingUsers.map((u) => u.user?.displayName ?? u.user?.email ?? 'Noen').join(', ')}.
                </div>
              )}
              <h1 className="text-5xl font-medium text-center sm:text-left font-heading text-heading-strong mb-6 leading-snug whitespace-pre-wrap wrap-break-word">
                {title}
              </h1>
              {description ? (
                <div
                  className="prose prose-headings:font-normal prose-headings:font-heading max-w-none dark:prose-invert"
                  onClick={handleDescriptionClick}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-muted-foreground text-sm italic">Ingen beskrivelse ennå.</p>
              )}
              <Comments
                taskId={task.id}
                comments={mapComments(liveComments)}
                currentUserId={currentUserId}
                canEdit={canEdit}
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
          mode={isEditing && canEdit ? 'edit' : 'view'}
          status={status}
          startAt={startAt}
          endAt={endAt}
          deadlinePriority={deadlinePriority}
          groupId={assignedGroupId}
          assigneeIds={assigneeIds}
          assignees={liveAssignees}
          createdAt={task.createdAt}
          updatedAt={task.updatedAt}
          statusOptions={taskGroupOptions}
          statuses={statuses}
          taskGroupOptions={taskGroupOptions}
          assigneeOptions={assigneeOptions}
          onStatusChange={
            !canEdit
              ? undefined
              : isEditing
                ? handleStatusChange
                : handleStatusChangeView
          }
          onStartChange={canEdit ? (isEditing ? handleStartChange : handleStartChange) : undefined}
          onEndChange={canEdit ? (isEditing ? handleEndChange : handleEndChange) : undefined}
          onDeadlinePriorityChange={
            canEdit
              ? isEditing
                ? handleDeadlinePriorityChange
                : handleDeadlinePriorityChange
              : undefined
          }
          onGroupChange={
            !canEdit
              ? undefined
              : isEditing
                ? handleGroupChange
                : handleGroupChangeView
          }
          onScheduleCommit={
            !canEdit || isEditing ? undefined : handleScheduleCommitView
          }
          onAssigneesChange={
            !canEdit
              ? undefined
              : isEditing
                ? handleAssigneesChangeLocal
                : assigneeOptions.length > 0
                  ? handleAssigneesChange
                  : undefined
          }
          assigneesSaving={assigneesSaving}
          taskId={task.id}
          onSave={canEdit ? (isEditing ? handleSave : handleStartEditing) : undefined}
          onCancel={handleCancel}
          onDeleteTask={canEdit ? handleDeleteTask : undefined}
          isSaving={isSaving}
          headerSlot={
            <TaskRevisionHistory
              taskId={task.id}
              statuses={statuses}
              canEdit={canEdit}
            />
          }
        />
      </div>
    </div>
  )
}