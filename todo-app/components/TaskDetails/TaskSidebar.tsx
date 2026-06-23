'use client'

import { useMemo, useState } from 'react'
import { TaskDeleteDialog } from '@/components/Task/TaskDeleteDialog'
import { TaskQuickEditForm } from '@/components/Task/TaskQuickEditForm'
import { Button } from '@/components/ui/button'
import { AssigneeOption, formatDate, Status, TaskGroup, User } from '@/lib/types'
import Link from 'next/link'
import { StatusOption } from '@/lib/types'
import React from 'react'
import { quickEditValuesFromSidebar } from '@/lib/taskQuickEdit'
import type { TaskQuickEditValues } from '@/lib/taskQuickEdit'

interface TaskSidebarProps {
  mode: 'create' | 'edit' | 'view'
  headerSlot?: React.ReactNode

  status?:        string
  deadline?:      Date | undefined
  groupId?:       string
  assigneeIds?:   string[]
  assignees?:     User[]
  createdAt?:     Date | null
  updatedAt?:     Date | null

  statuses?:         Status[]
  statusOptions?:    StatusOption[]
  taskGroupOptions?: StatusOption[]
  assigneeOptions?:  AssigneeOption[]

  onStatusChange?:    (value: string) => void
  onDeadlineChange?:  (value: Date | undefined) => void
  onGroupChange?:     (value: string) => void
  onAssigneesChange?: (value: string[]) => void

  taskId?: number

  onSave?:    () => void
  onCancel?:  () => void
  cancelHref?: string
  isSaving?:  boolean
  isPending?: boolean
  assigneesSaving?: boolean

  onDeleteTask?: () => Promise<{ error?: string } | void>
}

export function TaskSidebar({
  mode,
  headerSlot,
  status,
  deadline,
  groupId = 'none',
  assigneeIds = [],
  assignees = [],
  createdAt,
  updatedAt,
  statusOptions = [],
  statuses = [],
  taskGroupOptions = [],
  assigneeOptions = [],
  onStatusChange,
  onDeadlineChange,
  onGroupChange,
  onAssigneesChange,
  taskId,
  onSave,
  onCancel,
  cancelHref,
  isSaving,
  isPending,
  assigneesSaving = false,
  onDeleteTask,
}: TaskSidebarProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const taskGroups = useMemo<TaskGroup[]>(
    () => taskGroupOptions.map((group) => ({
      id: Number(group.value),
      title: group.label,
      color: '',
      createdBy: null,
      orgId: null,
      createdAt: null,
    })),
    [taskGroupOptions],
  )

  const quickEditValues = quickEditValuesFromSidebar(
    status,
    groupId,
    deadline,
    assigneeIds,
    statuses,
  )

  const handleQuickEditChange = (patch: Partial<TaskQuickEditValues>) => {
    if (patch.statusId !== undefined) {
      const nextStatus = statuses.find((entry) => String(entry.id) === patch.statusId)
      if (nextStatus) onStatusChange?.(nextStatus.label)
    }
    if (patch.groupId !== undefined) onGroupChange?.(patch.groupId)
    if ('deadline' in patch) onDeadlineChange?.(patch.deadline)
    if (patch.assigneeIds !== undefined) onAssigneesChange?.(patch.assigneeIds)
  }

  const handleConfirmDelete = async () => {
    if (!onDeleteTask) return

    setIsDeleting(true)
    const result = await onDeleteTask()
    setIsDeleting(false)

    if (result?.error) return

    setDeleteOpen(false)
  }

  return (
    <div className="flex shrink-0 flex-col gap-4 min-h-0 min-w-sm max-w-lg overflow-y-auto border-l px-8 py-12">

      <div className="flex gap-3 items-center">
        {headerSlot}
        {mode === 'create' && (
          <>
            <Button variant="brand" type="submit" disabled={isPending}>
              {isPending ? 'Oppretter...' : 'Opprett oppgave'}
            </Button>
            {cancelHref && (
              <Button variant="ghost" type="button" asChild>
                <Link href={cancelHref}>Tilbake til tavle</Link>
              </Button>
            )}
          </>
        )}
        {mode === 'edit' && (
          <>
            <Button variant="brand" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
              Avbryt
            </Button>
          </>
        )}
        {mode === 'view' && (
          <>
            <Button variant="secondary" onClick={onSave}>
              Rediger
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Sist redigert: {formatDate(updatedAt)}
            </span>
          </>
        )}
      </div>

      {mode !== 'create' && createdAt && (
        <div className="flex items-center">
          <span className="w-1/2">Opprettet:</span>
          <p>{formatDate(createdAt)}</p>
        </div>
      )}

      {mode === 'create' ? (
        <TaskQuickEditForm
          variant="sidebar"
          values={quickEditValues}
          onChange={handleQuickEditChange}
          statuses={statuses}
          taskGroups={taskGroups}
          assigneeOptions={assigneeOptions}
          assignees={assignees}
          taskId={taskId}
          deadlineName="deadline"
        />
      ) : (
        <TaskQuickEditForm
          variant="sidebar"
          values={quickEditValues}
          onChange={handleQuickEditChange}
          statuses={statuses}
          taskGroups={taskGroups}
          assigneeOptions={assigneeOptions}
          assignees={assignees}
          taskId={taskId}
          statusDisabled={!onStatusChange}
          deadlineDisabled={!onDeadlineChange}
          groupDisabled={!onGroupChange}
          assigneesDisabled={
            mode === 'edit'
              ? assigneesSaving
              : !onAssigneesChange || assigneesSaving
          }
        />
      )}

      {mode !== 'create' && onDeleteTask && (
        <section className="mt-auto flex flex-col gap-3 border-t border-destructive/20 pt-4">
          <div>
            <h2 className="text-sm font-medium text-destructive">Faresone</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Slett oppgaven permanent. Dette kan ikke angres.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={() => setDeleteOpen(true)}
            disabled={isDeleting}
          >
            Slett oppgave
          </Button>
        </section>
      )}

      <TaskDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
