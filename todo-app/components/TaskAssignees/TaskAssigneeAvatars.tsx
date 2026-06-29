'use client'

import * as React from 'react'
import { Bell, Plus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'

import { TaskAssigneeEditor } from '@/components/TaskAssignees/TaskAssigneeEditor'
import { useKanbanOverlayLock } from '@/components/Kanban/KanbanOverlayLock'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { notifyTaskAssignee } from '@/lib/actions/notifications'
import { updateTask } from '@/lib/actions/tasks'
import { assigneeDisplayName, assigneeInitials, usersFromAssigneeIds } from '@/lib/taskAssignees'
import type { AssigneeOption, Task, User } from '@/lib/types'

const VISIBLE_AVATARS = 3
const CHIP_SIZE = 'size-8'

interface TaskAssigneeAvatarsProps {
  task: Task
  assigneeOptions: AssigneeOption[]
  onOptimisticPatch?: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback?: (taskId: number, prev: Task) => void
  className?: string
}

export function TaskAssigneeAvatars({
  task,
  assigneeOptions,
  onOptimisticPatch,
  onOptimisticRollback,
  className,
}: TaskAssigneeAvatarsProps) {
  const [open, setOpen] = React.useState(false)
  const [openMenuUserId, setOpenMenuUserId] = React.useState<string | null>(null)
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [removingUserId, setRemovingUserId] = React.useState<string | null>(null)
  const [notifyingUserId, setNotifyingUserId] = React.useState<string | null>(null)
  const [tooltipUserId, setTooltipUserId] = React.useState<string | null>(null)

  useKanbanOverlayLock(open || openMenuUserId !== null)

  const assignees = task.assignees ?? []
  const visible = assignees.slice(0, VISIBLE_AVATARS)
  const overflow = assignees.length - visible.length

  const openModal = (event: React.MouseEvent) => {
    event.stopPropagation()
    setAssigneeIds(assignees.map((user) => user.id))
    setOpen(true)
  }

  const persistAssignees = async (nextIds: string[]) => {
    const prev = task
    const nextAssignees = usersFromAssigneeIds(nextIds, assignees, assigneeOptions)

    onOptimisticPatch?.(task.id, { assignees: nextAssignees })

    const result = await updateTask(task.id, { assigneeIds: nextIds })

    if ('error' in result) {
      toast.error(result.error)
      onOptimisticRollback?.(task.id, prev)
      return false
    }

    return true
  }

  const handleNotifyAssignee = async (user: User) => {
    setOpenMenuUserId(null)
    setNotifyingUserId(user.id)

    const result = await notifyTaskAssignee(task.id, user.id)
    setNotifyingUserId(null)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    toast.success(`Varsling sendt til ${assigneeDisplayName(user)}`)
  }

  const handleRemoveAssignee = async (userId: string) => {
    setOpenMenuUserId(null)
    setRemovingUserId(userId)

    const nextIds = assignees.map((user) => user.id).filter((id) => id !== userId)
    await persistAssignees(nextIds)

    setRemovingUserId(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const ok = await persistAssignees(assigneeIds)
    setIsSaving(false)
    if (ok) setOpen(false)
  }

  return (
    <>
      <div
        className={`flex min-w-0 items-center gap-1.5 ${className ?? ''}`}
        data-no-nav
        onClick={(event) => event.stopPropagation()}
      >
        {assignees.length > 0 && (
          <AvatarGroup className="-space-x-1 *:data-[slot=avatar]:size-8">
            {visible.map((user) => {
              const label = assigneeDisplayName(user)
              const isRemoving = removingUserId === user.id
              const isNotifying = notifyingUserId === user.id
              const menuOpen = openMenuUserId === user.id
              const isBusy = isRemoving || isNotifying

              return (
                <DropdownMenu
                  key={user.id}
                  open={menuOpen}
                  onOpenChange={(isOpen) => {
                    setOpenMenuUserId(isOpen ? user.id : null)
                    if (isOpen) setTooltipUserId(null)
                  }}
                >
                  <Tooltip
                    open={tooltipUserId === user.id && !menuOpen}
                    onOpenChange={(isOpen) => {
                      if (menuOpen) return
                      setTooltipUserId(isOpen ? user.id : null)
                    }}
                  >
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          disabled={isBusy}
                          aria-label={label}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Avatar className={CHIP_SIZE}>
                            {user.avatarUrl ? (
                              <AvatarImage src={user.avatarUrl} alt={label} />
                            ) : null}
                            <AvatarFallback className="text-[11px]">
                              {assigneeInitials(label)}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{label}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="w-52" data-no-nav>
                    <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
                    <DropdownMenuItem
                      disabled={isBusy}
                      onSelect={(event) => {
                        event.preventDefault()
                        void handleNotifyAssignee(user)
                      }}
                    >
                      <Bell className="size-4" />
                      Varsle om oppgave
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={isBusy}
                      onSelect={(event) => {
                        event.preventDefault()
                        void handleRemoveAssignee(user.id)
                      }}
                    >
                      <UserMinus className="size-4" />
                      Fjern fra oppgave
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
            {overflow > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${overflow} flere ansvarlige`}
                    onClick={openModal}
                  >
                    <Avatar className={`${CHIP_SIZE} bg-muted text-[11px] text-muted-foreground`}>
                      <AvatarFallback>+{overflow}</AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Vis alle ansvarlige</TooltipContent>
              </Tooltip>
            )}
          </AvatarGroup>
        )}

        {assigneeOptions.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="size-8! shrink-0 rounded-full p-0 [&_svg]:size-4"
                aria-label="Legg til ansvarlig"
                onClick={openModal}
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Legg til ansvarlig</TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm"
          data-no-nav
          onClick={(e) => e.stopPropagation()}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Ansvarlige</DialogTitle>
            <DialogDescription>
              Søk etter medlemmer og legg dem til oppgaven.
            </DialogDescription>
          </DialogHeader>

          <TaskAssigneeEditor
            options={assigneeOptions}
            value={assigneeIds}
            onChange={setAssigneeIds}
            assignees={task.assignees}
            taskId={task.id}
            placeholder="Søk etter medlem…"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Avbryt
            </Button>
            <Button variant="brand" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? 'Lagrer…' : 'Lagre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
