'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { TaskQuickEditForm } from '@/components/Task/TaskQuickEditForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateTask } from '@/lib/actions/tasks'
import {
  quickEditValuesToTaskPatch,
  taskToQuickEditValues,
  type TaskQuickEditValues,
} from '@/lib/taskQuickEdit'
import type { AssigneeOption, Status, Task, TaskGroup } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskQuickEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  statuses: Status[]
  taskGroups: TaskGroup[]
  assigneeOptions?: AssigneeOption[]
  onOptimisticPatch?: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback?: (taskId: number, prev: Task) => void
  onSaved?: () => void
  contentClassName?: string
}

export function TaskQuickEditDialog({
  open,
  onOpenChange,
  task,
  statuses,
  taskGroups,
  assigneeOptions = [],
  onOptimisticPatch,
  onOptimisticRollback,
  onSaved,
  contentClassName,
}: TaskQuickEditDialogProps) {
  const [values, setValues] = useState<TaskQuickEditValues>(() =>
    taskToQuickEditValues(task, statuses),
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(taskToQuickEditValues(task, statuses))
  }, [open, task, statuses])

  const handleChange = (patch: Partial<TaskQuickEditValues>) => {
    setValues((current) => ({ ...current, ...patch }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const prev = task
    const { patch, payload } = quickEditValuesToTaskPatch(
      values,
      task,
      statuses,
      taskGroups,
      assigneeOptions,
    )

    onOptimisticPatch?.(task.id, patch)

    const result = await updateTask(task.id, payload)
    setIsSaving(false)

    if ('error' in result) {
      toast.error(result.error)
      onOptimisticRollback?.(task.id, prev)
      return
    }

    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-sm', contentClassName)}>
        <DialogHeader>
          <DialogTitle>Rediger oppgave</DialogTitle>
          <DialogDescription>
            Oppdater status, gruppe, frist eller ansvarlige.
          </DialogDescription>
        </DialogHeader>

        <TaskQuickEditForm
          values={values}
          onChange={handleChange}
          statuses={statuses}
          taskGroups={taskGroups}
          assigneeOptions={assigneeOptions}
          assignees={task.assignees}
          taskId={task.id}
          isOrgTask={task.orgId != null}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Avbryt
          </Button>
          <Button variant="brand" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Lagrer…' : 'Lagre endringer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
