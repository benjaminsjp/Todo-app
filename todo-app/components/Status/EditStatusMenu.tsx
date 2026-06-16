'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { updateStatus, deleteStatus } from '@/lib/actions/statuses'
import { cn } from '@/lib/utils'
import { type Status } from '@/lib/types'
import { STATUS_ICON_OPTIONS, type StatusIconName } from '@/lib/statusIcons'

const COLORS = [
  { label: 'Gray',   value: 'gray',   class: 'bg-gray-500'   },
  { label: 'Blue',   value: 'blue',   class: 'bg-blue-500'   },
  { label: 'Green',  value: 'green',  class: 'bg-green-500'  },
  { label: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
  { label: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { label: 'Red',    value: 'red',    class: 'bg-red-500'    },
  { label: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { label: 'Pink',   value: 'pink',   class: 'bg-pink-500'   },
]

export function EditStatusMenu({ status }: { status: Status }) {
  const router = useRouter()
  const [editOpen,   setEditOpen]   = useState(false)
  const [isSaving,   setIsSaving]   = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [label,      setLabel]      = useState(status.label)
  const [color,      setColor]      = useState(status.color)
  const [icon,       setIcon]       = useState<StatusIconName>(
    (status.icon as StatusIconName) ?? STATUS_ICON_OPTIONS[0].name
  )

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    const result = await updateStatus(status.id, { label, color, icon })
    setIsSaving(false)
    if ('error' in result) { setError(result.error); return }
    setEditOpen(false)
    router.refresh()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteStatus(status.id)
    setIsDeleting(false)
    if ('error' in result) { setError(result.error); return }
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className=""
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            {isDeleting ? 'Deleting...' : 'Delete status'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-sans font-medium">Edit status</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="label" className="pb-2">Name</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="pb-2">Icon</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_ICON_OPTIONS.map(({ name, icon: Icon, label: iconLabel }) => (
                  <button
                    key={name}
                    type="button"
                    title={iconLabel}
                    onClick={() => setIcon(name)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg border transition-all hover:bg-accent',
                      icon === name && 'ring-2 ring-foreground bg-accent'
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="pb-2">Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setColor(c.value)}
                    className={cn(
                      'w-7 h-7 rounded-full ring-offset-2 transition-all hover:scale-110',
                      c.class,
                      color === c.value && 'ring-2 ring-foreground scale-110'
                    )}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button variant="brand" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}