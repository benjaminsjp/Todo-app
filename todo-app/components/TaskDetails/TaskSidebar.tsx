'use client'

import { useMemo, useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { TaskDeleteDialog } from '@/components/Task/TaskDeleteDialog'
import { TaskPropertiesRail } from '@/components/TaskDetails/TaskPropertiesRail'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { quickEditValuesFromSidebar } from '@/lib/taskQuickEdit'
import type { TaskQuickEditValues } from '@/lib/taskQuickEdit'
import { AssigneeOption, formatDate, Status, TaskGroup, User } from '@/lib/types'

interface TaskSidebarProps {
  mode: 'create' | 'edit' | 'view'
  headerSlot?: React.ReactNode

  status?:        string
  startAt?:       Date | undefined
  endAt?:         Date | undefined
  groupId?:       string
  assigneeIds?:   string[]
  assignees?:     User[]
  createdAt?:     Date | null
  updatedAt?:     Date | null

  statuses?:         Status[]
  statusOptions?:    { value: string; label: string; color: string }[]
  taskGroupOptions?: { value: string; label: string; color: string }[]

  assigneeOptions?:  AssigneeOption[]

  onStatusChange?:    (value: string) => void
  onStartChange?:     (value: Date | undefined) => void
  onEndChange?:       (value: Date | undefined) => void
  onGroupChange?:     (value: string) => void
  onAssigneesChange?: (value: string[]) => void
  onScheduleCommit?:  () => void

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
  startAt,
  endAt,
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
  onStartChange,
  onEndChange,
  onGroupChange,
  onAssigneesChange,
  onScheduleCommit,
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
    startAt,
    endAt,
    assigneeIds,
    statuses,
  )

  const handleQuickEditChange = (patch: Partial<TaskQuickEditValues>) => {
    if (patch.statusId !== undefined) {
      const nextStatus = statuses.find((entry) => String(entry.id) === patch.statusId)
      if (nextStatus) onStatusChange?.(nextStatus.label)
    }
    if (patch.groupId !== undefined) onGroupChange?.(patch.groupId)
    if ('startAt' in patch) onStartChange?.(patch.startAt)
    if ('endAt' in patch) onEndChange?.(patch.endAt)
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

  const scheduleDisabled =
    mode === 'create' ? false : !onStartChange && !onEndChange

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-5 min-h-0 overflow-x-visible overflow-y-auto border-l px-5 py-8 xl:w-80 xl:px-6">

      <div className="flex items-center gap-2">
        {mode === 'create' && (
          <div className="flex flex-1 flex-wrap gap-2">
            <Button variant="brand" type="submit" disabled={isPending}>
              {isPending ? 'Oppretter...' : 'Opprett'}
            </Button>
            {cancelHref && (
              <Button variant="ghost" type="button" size="sm" asChild>
                <Link href={cancelHref}>Avbryt</Link>
              </Button>
            )}
          </div>
        )}

        {mode === 'edit' && (
          <div className="flex flex-1 flex-wrap gap-2">
            <Button variant="brand" size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Lagrer...' : 'Lagre'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
              Avbryt
            </Button>
          </div>
        )}

        {mode === 'view' && onSave && (
          <Button variant="secondary" size="sm" className="mr-auto" onClick={onSave}>
            Rediger
          </Button>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {headerSlot}
          {mode !== 'create' && onDeleteTask && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" title="Flere handlinger">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => {
                    event.preventDefault()
                    setDeleteOpen(true)
                  }}
                >
                  <Trash2 className="size-4" />
                  Slett oppgave
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {mode === 'view' && updatedAt && (
        <p className="text-xs text-muted-foreground -mt-2">
          Sist redigert {formatDate(updatedAt)}
        </p>
      )}

      <TaskPropertiesRail
        mode={mode}
        values={quickEditValues}
        onChange={handleQuickEditChange}
        statuses={statuses}
        taskGroups={taskGroups}
        assigneeOptions={assigneeOptions}
        assignees={assignees}
        taskId={taskId}
        statusDisabled={mode !== 'create' && !onStatusChange}
        scheduleDisabled={scheduleDisabled}
        groupDisabled={mode !== 'create' && !onGroupChange}
        assigneesDisabled={
          mode === 'create'
            ? false
            : mode === 'edit'
              ? assigneesSaving
              : !onAssigneesChange || assigneesSaving
        }
        isOrgTask={assigneeOptions.length > 1}
        onScheduleCommit={onScheduleCommit}
      />

      {mode !== 'create' && createdAt && (
        <p className="mt-auto text-xs text-muted-foreground border-t pt-4">
          Opprettet {formatDate(createdAt)}
        </p>
      )}

      <TaskDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </aside>
  )
}
