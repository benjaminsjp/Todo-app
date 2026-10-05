'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskGroupModal } from '@/components/CreateTaskGroup/TaskGroupModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { deleteTaskGroup } from '@/lib/actions/taskGroups'

import { getColor, type TaskGroup } from '@/lib/types'
import { cn } from '@/lib/utils'


interface TaskGroupPillProps {
  group:        TaskGroup
  isActive:     boolean
  filterHref:   string
  canEdit?:     boolean
}

export function TaskGroupPill({ group, isActive, filterHref, canEdit = true }: TaskGroupPillProps) {
  const router = useRouter()
  const [editOpen,  setEditOpen]  = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const colors = getColor(group.color)

  const handleDelete = async (): Promise<boolean> => {
    setIsDeleting(true)
    setError(null)
    const result = await deleteTaskGroup(group.id)
    setIsDeleting(false)
    if ('error' in result) { setError(result.error); return false }
    router.refresh()
    return true
  }

  return (
    <>
      <div
        className={cn(
          'group/pill flex items-center rounded-full border text-sm font-medium',
          'transition-colors select-none',
          colors.border,
          isActive ? colors.opacity : 'bg-card',
        )}
      >
        <Link
          href={filterHref}
          className={cn(
            'flex items-center gap-2 py-1.5 pl-4',
            canEdit ? 'rounded-l-full pr-1' : 'rounded-full pr-4',
          )}
        >
          <span className={cn('size-2 rounded-full', group.color)} />
          {group.title}
          <Badge
            variant="secondary"
            className={cn(
              'ml-1 rounded-full px-1.5 py-0 text-xs',
              isActive && `${colors.bg} text-white`,
            )}
          >
            {group.taskCount ?? group.tasks?.length ?? 0}
          </Badge>
        </Link>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Handlinger for ${group.title}`}
                className={cn(
                  'mr-1 flex size-6 shrink-0 items-center justify-center rounded-full',
                  'text-muted-foreground transition-colors',
                  'hover:bg-foreground/10 hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'opacity-60 group-hover/pill:opacity-100 data-[state=open]:opacity-100',
                )}
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Rediger gruppe
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
                {isDeleting ? 'Sletter...' : 'Slett gruppe'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {canEdit && (
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Slett gruppe</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette denne oppgavegruppen?
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const ok = await handleDelete()
                if (ok) setDeleteOpen(false)
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Sletter...' : 'Slett gruppe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {canEdit && (
      <TaskGroupModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        group={{ id: group.id, title: group.title, color: group.color }}
      />
      )}
    </>
  )
}
