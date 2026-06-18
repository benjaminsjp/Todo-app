'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu'
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

import { Pencil, Trash2 } from 'lucide-react'

import { deleteTaskGroup } from '@/lib/actions/taskGroups'

import { getColor, type TaskGroup } from '@/lib/types'


interface TaskGroupPillProps {
  group:        TaskGroup
  isActive:     boolean
  filterHref:   string
}

export function TaskGroupPill({ group, isActive, filterHref }: TaskGroupPillProps) {
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link href={filterHref}>
            <div className={`
              flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium
              transition-colors cursor-pointer select-none
              ${colors.border}
              ${isActive ? colors.opacity : 'bg-card'}
            `}>
              <span className={`w-2 h-2 rounded-full ${group.color}`} />
              {group.title}
              <Badge
                variant="secondary"
                className={`ml-1 rounded-full px-1.5 py-0 text-xs
                  ${isActive ? `${colors.bg} text-white` : ''}
                `}
              >
                {group.taskCount ?? group.tasks?.length ?? 0}
              </Badge>
            </div>
          </Link>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Rediger gruppe
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={isDeleting}
          >
            <Trash2 className="size-4 text-destructive!" />
            {isDeleting ? 'Sletter...' : 'Slett gruppe'}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

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

      {/* Edit modal */}
      <TaskGroupModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        group={{ id: group.id, title: group.title, color: group.color }}
      />
    </>
  )
}