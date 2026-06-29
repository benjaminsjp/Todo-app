'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { TaskAssigneeSelectedList } from '@/components/TaskAssignees/TaskAssigneeSelectedList'
import { resolveAssigneeMembers, mergeAssigneeOptionsForEditor } from '@/lib/taskAssignees'
import { cn } from '@/lib/utils'
import type { AssigneeOption, User } from '@/lib/types'

interface TaskAssigneeEditorProps {
  options: AssigneeOption[]
  value: string[]
  onChange: (value: string[]) => void
  assignees?: User[]
  taskId?: number
  disabled?: boolean
  placeholder?: string
  className?: string
  listClassName?: string
  /** Rail: søkeliste åpner mot venstre over sidepanel-skillet. */
  variant?: 'default' | 'rail'
}

export function TaskAssigneeEditor({
  options,
  value,
  onChange,
  assignees = [],
  taskId,
  disabled = false,
  placeholder = 'Søk etter medlem…',
  className,
  listClassName,
  variant = 'default',
}: TaskAssigneeEditorProps) {
  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const editorOptions = React.useMemo(
    () => mergeAssigneeOptionsForEditor(options, assignees),
    [options, assignees],
  )

  const selectedIds = React.useMemo(
    () => new Set(value.map((id) => String(id))),
    [value],
  )

  const availableOptions = React.useMemo(
    () => editorOptions.filter((option) => !selectedIds.has(String(option.value))),
    [editorOptions, selectedIds],
  )

  const filteredOptions = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return availableOptions
    return availableOptions.filter((option) =>
      option.label.toLowerCase().includes(needle),
    )
  }, [availableOptions, query])

  const selectedMembers = React.useMemo(
    () => resolveAssigneeMembers(value, assignees, options),
    [value, assignees, options],
  )

  const handleSelect = (id: string) => {
    if (value.includes(id)) return
    onChange([...value, id])
    setQuery('')
    setOpen(false)
  }

  const handleRemove = (id: string) => {
    onChange(value.filter((memberId) => memberId !== id))
  }

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const showDropdown = open && !disabled && availableOptions.length > 0
  const inputPlaceholder =
    editorOptions.length === 0
      ? 'Ingen medlemmer tilgjengelig'
      : availableOptions.length === 0
        ? 'Alle medlemmer er lagt til'
        : placeholder

  const inputDisabled =
    disabled || editorOptions.length === 0 || availableOptions.length === 0

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div ref={containerRef} className="relative">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={inputPlaceholder}
          disabled={inputDisabled}
          autoComplete="off"
        />

        {showDropdown && (
          <div
            className={cn(
              'absolute top-[calc(100%+0.25rem)] z-[200] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/5',
              variant === 'rail'
                ? 'right-0 w-[min(18rem,calc(100vw-2.5rem))]'
                : 'left-0 w-full',
            )}
          >
            <ul className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Ingen treff.
                </li>
              ) : (
                filteredOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      <TaskAssigneeSelectedList
        members={selectedMembers}
        onRemove={handleRemove}
        taskId={taskId}
        disabled={disabled}
        className={listClassName}
      />
    </div>
  )
}
