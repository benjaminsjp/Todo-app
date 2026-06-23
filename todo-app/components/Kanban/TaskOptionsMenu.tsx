"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { TaskDeleteDialog } from "@/components/Task/TaskDeleteDialog"
import { TaskQuickEditDialog } from "@/components/Task/TaskQuickEditDialog"
import { useKanbanOverlayLock } from "@/components/Kanban/KanbanOverlayLock"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AssigneeOption, Status, Task, TaskGroup } from "@/lib/types"
import { deleteTask } from "@/lib/actions/tasks"

export function TaskOptionsMenu({
  task,
  statuses,
  taskGroups,
  assigneeOptions = [],
  onOptimisticPatch,
  onOptimisticRollback,
  onDeleted,
}: {
  task: Task
  statuses: Status[]
  taskGroups: TaskGroup[]
  assigneeOptions?: AssigneeOption[]
  onOptimisticPatch: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback: (taskId: number, prev: Task) => void
  onDeleted?: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useKanbanOverlayLock(editOpen || deleteOpen)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteTask(task.id)
    setIsDeleting(false)

    if ("error" in result) {
      toast.error(result.error)
      return
    }

    setDeleteOpen(false)
    toast.success("Oppgaven ble slettet")
    onDeleted?.()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="transition-opacity"
            data-no-nav
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" data-no-nav>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setEditOpen(true)
            }}
          >
            <Pencil className="size-4" /> Hurtigredigering
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            <Trash2 className="size-4" /> Slett oppgave
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskQuickEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        statuses={statuses}
        taskGroups={taskGroups}
        assigneeOptions={assigneeOptions}
        onOptimisticPatch={onOptimisticPatch}
        onOptimisticRollback={onOptimisticRollback}
        contentClassName="data-no-nav"
      />

      <TaskDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        contentClassName="data-no-nav"
      />
    </>
  )
}
