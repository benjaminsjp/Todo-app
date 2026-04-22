'use client'

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CreateTaskDeadline } from '@/components/CreateTask/CreateTaskDeadline'
import { formatDate, Status } from '@/lib/types'
import Link from 'next/link'
import { StatusOption } from '@/lib/types'
import React from 'react'
interface TaskSidebarProps {
  mode: 'create' | 'edit' | 'view'
  headerSlot?: React.ReactNode

  status?:        string
  deadline?:      Date | undefined
  groupId?:       string
  createdAt?:     Date | null
  updatedAt?:     Date | null

  statuses?:         Status[]
  statusOptions?:    StatusOption[]
  taskGroupOptions?: StatusOption[]

  onStatusChange?:   (value: string) => void
  onDeadlineChange?: (value: Date | undefined) => void
  onGroupChange?:    (value: string) => void

  onSave?:    () => void
  onCancel?:  () => void
  cancelHref?: string   
  isSaving?:  boolean
  isPending?: boolean
}

export function TaskSidebar({
  mode,
  headerSlot,
  status,
  deadline,
  groupId = 'none',
  createdAt,
  updatedAt,
  statusOptions = [],
  statuses = [],
  taskGroupOptions = [],
  onStatusChange,
  onDeadlineChange,
  onGroupChange,
  onSave,
  onCancel,
  cancelHref,
  isSaving,
  isPending,
}: TaskSidebarProps) {
  return (
    <div className="flex flex-col gap-4 min-w-sm max-w-lg border-l px-8 py-12">

      <div className="flex gap-3 items-center">
        {headerSlot}
        {mode === 'create' && (
          <>
            <Button variant="brand" type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create task'}
            </Button>
            {cancelHref && (
              <Button variant="ghost" type="button" asChild>
                <Link href={cancelHref}>Cancel</Link>
              </Button>
            )}
          </>
        )}
        {mode === 'edit' && (
          <>
            <Button variant="brand" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          </>
        )}
        {mode === 'view' && (
          <>
            <Button variant="secondary" onClick={onSave}>
              Edit
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Last edited: {formatDate(updatedAt)}
            </span>
          </>
        )}
      </div>

      {mode !== 'create' && (
        <div className="flex items-center">
          <span className="w-1/2">Status:</span>
          <Select
            value={status ?? 'Todo'}
            onValueChange={onStatusChange ?? (() => {})}
            disabled={!onStatusChange}
          >
            <SelectTrigger className="shadow-none focus:ring-0 h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-1">
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.label}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {mode !== 'create' && createdAt && (
        <div className="flex items-center">
          <span className="w-1/2">Created:</span>
          <p>{formatDate(createdAt)}</p>
        </div>
      )}

      <div className="flex items-center">
        <span className="w-1/2">Deadline:</span>
        <CreateTaskDeadline
          value={deadline}
          onChange={onDeadlineChange ?? (() => {})}
          disabled={mode !== 'create' && !onDeadlineChange}
          {...(mode === 'create' ? { name: 'deadline' } : {})}
        />
      </div>

      <div className="flex items-center">
        <span className="w-1/2">Group:</span>
          <Select value={groupId} onValueChange={onGroupChange ?? (() => {})} disabled={!onGroupChange}>
            <SelectTrigger className="shadow-none focus:ring-0 h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-1">
              <SelectItem value="none">No group</SelectItem>
              {taskGroupOptions.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>
    </div>
  )
}