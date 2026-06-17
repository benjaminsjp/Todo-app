"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { CreateTaskDeadline } from "@/components/CreateTask/CreateTaskDeadline"
import type { Status, Task, TaskGroup } from "@/lib/types"
import { updateTask, deleteTask } from "@/lib/actions/tasks"

export function TaskOptionsMenu({
  task,
  statuses,
  taskGroups,
  onOptimisticPatch,
  onOptimisticRollback,
}: {
  task: Task
  statuses: Status[]
  taskGroups: TaskGroup[]
  onOptimisticPatch: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback: (taskId: number, prev: Task) => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusIdInitial = task.status?.id ? String(task.status.id) : "none"
  const groupIdInitial = task.groupId ? String(task.groupId) : "none"
  const deadlineInitial = task.deadline ? new Date(task.deadline) : undefined

  const [statusId, setStatusId] = useState(statusIdInitial)
  const [groupId, setGroupId] = useState(groupIdInitial)
  const [deadline, setDeadline] = useState<Date | undefined>(deadlineInitial)

  const statusById = useMemo(() => {
    const map = new Map<number, Status>()
    for (const s of statuses) map.set(s.id, s)
    return map
  }, [statuses])

  const groupById = useMemo(() => {
    const map = new Map<number, TaskGroup>()
    for (const g of taskGroups) map.set(g.id, g)
    return map
  }, [taskGroups])

  const handleSave = async () => {
    setIsSaving(true)
    const prev = task

    const nextStatus =
      statusId === "none" ? null : statusById.get(Number(statusId)) ?? null
    const nextGroup =
      groupId === "none" ? null : groupById.get(Number(groupId)) ?? null

    const patch: Partial<Task> = {
      status: nextStatus,
      statusId: nextStatus?.id ?? null,
      group: nextGroup,
      groupId: nextGroup?.id ?? null,
      deadline: deadline ? deadline.toISOString().split("T")[0] : null,
    }

    onOptimisticPatch(task.id, patch)

    const result = await updateTask(task.id, {
      statusId: nextStatus?.id ?? null,
      groupId: nextGroup?.id ?? null,
      deadline: deadline ? deadline.toISOString().split("T")[0] : null,
    })

    setIsSaving(false)

    if ("error" in result) {
      toast.error(result.error)
      onOptimisticRollback(task.id, prev)
      return
    }

    setEditOpen(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteTask(task.id)
    setIsDeleting(false)

    if ("error" in result) {
      toast.error(result.error)
      return
    }

    setDeleteOpen(false)
    toast.success("Task deleted")
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
              setStatusId(statusIdInitial)
              setGroupId(groupIdInitial)
              setDeadline(deadlineInitial)
              setEditOpen(true)
            }}
          >
            <Pencil className="size-4" /> Quick edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            <Trash2 className="size-4" /> Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm" data-no-nav>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update status, group, or deadline.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="p-1">
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-1">
                  <SelectItem value="none">No group</SelectItem>
                  {taskGroups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Deadline</Label>
              <CreateTaskDeadline value={deadline} onChange={setDeadline} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm" data-no-nav>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

