'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  Calendar,
  CircleDot,
  Folder,
  Users,
} from 'lucide-react'

import { TaskScheduleFields } from '@/components/CreateTask/TaskScheduleFields'
import { TaskAssigneeEditor } from '@/components/TaskAssignees/TaskAssigneeEditor'
import { TaskPropertyRow } from '@/components/TaskDetails/TaskPropertyRow'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { assigneeDisplayName, assigneeInitials } from '@/lib/taskAssignees'
import { formatTaskScheduleLabel, formatTaskScheduleRange } from '@/lib/taskSchedule'
import type { TaskQuickEditValues } from '@/lib/taskQuickEdit'
import type { AssigneeOption, Status, TaskGroup, User } from '@/lib/types'
import { cn } from '@/lib/utils'

const RAIL_TRIGGER =
  'w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors'

const RAIL_SELECT_TRIGGER =
  'h-10 w-full px-3 shadow-none'

const RAIL_POPOVER_SIDE = 'left' as const
const RAIL_POPOVER_ALIGN = 'start' as const
const RAIL_POPOVER_OFFSET = 14
const RAIL_POPOVER_COLLISION = 20

interface TaskPropertiesRailProps {
  mode: 'create' | 'edit' | 'view'
  values: TaskQuickEditValues
  onChange: (patch: Partial<TaskQuickEditValues>) => void
  statuses: Status[]
  taskGroups: TaskGroup[]
  assigneeOptions: AssigneeOption[]
  assignees?: User[]
  taskId?: number
  statusDisabled?: boolean
  scheduleDisabled?: boolean
  groupDisabled?: boolean
  assigneesDisabled?: boolean
  isOrgTask?: boolean
  onScheduleCommit?: () => void
}

function PropertySection({
  children,
  isSection,
}: {
  children: ReactNode
  isSection: boolean
}) {
  if (!isSection) return <>{children}</>

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3.5">
      {children}
    </div>
  )
}

function AssigneeRailValue({ assignees }: { assignees: User[] }) {
  if (assignees.length === 0) {
    return <span className="text-muted-foreground">Ingen</span>
  }

  const visible = assignees.slice(0, 3)
  const overflow = assignees.length - visible.length

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <AvatarGroup className="-space-x-1.5 *:data-[slot=avatar]:size-6">
        {visible.map((user) => {
          const label = assigneeDisplayName(user)
          return (
            <Avatar key={user.id} className="size-6">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={label} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {assigneeInitials(label)}
              </AvatarFallback>
            </Avatar>
          )
        })}
      </AvatarGroup>
      <span className="truncate leading-snug">
        {visible.map((user) => assigneeDisplayName(user)).join(', ')}
        {overflow > 0 ? ` +${overflow}` : ''}
      </span>
    </div>
  )
}

export function TaskPropertiesRail({
  mode,
  values,
  onChange,
  statuses,
  taskGroups,
  assigneeOptions,
  assignees = [],
  taskId,
  statusDisabled = false,
  scheduleDisabled = false,
  groupDisabled = false,
  assigneesDisabled = false,
  isOrgTask = false,
  onScheduleCommit,
}: TaskPropertiesRailProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [assigneesOpen, setAssigneesOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)

  const showAssignees =
    isOrgTask || assigneeOptions.length > 0 || values.assigneeIds.length > 0

  const statusLabel = useMemo(() => {
    const match = statuses.find((status) => String(status.id) === values.statusId)
    return match?.label ?? '–'
  }, [statuses, values.statusId])

  const groupLabel = useMemo(() => {
    if (values.groupId === 'none') return 'Ingen gruppe'
    const match = taskGroups.find((group) => String(group.id) === values.groupId)
    return match?.title ?? '–'
  }, [taskGroups, values.groupId])

  const scheduleDisplay = formatTaskScheduleRange(values.startAt, values.endAt)
  const scheduleHint = values.deadlinePriority
    ? `${formatTaskScheduleLabel(values.startAt, values.endAt)} · Prioritet`
    : formatTaskScheduleLabel(values.startAt, values.endAt)

  const isView = mode === 'view'
  const isSection = !isView
  const rowVariant = isSection ? 'section' : 'default'

  const selectMenuProps = (side: 'left' | 'bottom' = 'left') => ({
    position: 'popper' as const,
    side,
    align: RAIL_POPOVER_ALIGN,
    sideOffset: side === 'left' ? RAIL_POPOVER_OFFSET : 6,
    collisionPadding: RAIL_POPOVER_COLLISION,
    className: 'min-w-[12rem] w-auto max-w-[min(18rem,calc(100vw-2.5rem))] p-1',
  })

  const statusSelect = (menuSide: 'left' | 'bottom' = 'left') => (
    <Select
      value={values.statusId}
      onValueChange={(value) => {
        onChange({ statusId: value })
        setStatusOpen(false)
      }}
      disabled={statusDisabled}
    >
      <SelectTrigger className={RAIL_SELECT_TRIGGER}>
        <SelectValue placeholder="Velg status" />
      </SelectTrigger>
      <SelectContent {...selectMenuProps(menuSide)}>
        {statuses.map((status) => (
          <SelectItem key={status.id} value={String(status.id)}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const groupSelect = (menuSide: 'left' | 'bottom' = 'left') => (
    <Select
      value={values.groupId}
      onValueChange={(value) => {
        onChange({ groupId: value })
        setGroupOpen(false)
      }}
      disabled={groupDisabled}
    >
      <SelectTrigger className={RAIL_SELECT_TRIGGER}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent {...selectMenuProps(menuSide)}>
        <SelectItem value="none">Ingen gruppe</SelectItem>
        {taskGroups.map((group) => (
          <SelectItem key={group.id} value={String(group.id)}>
            {group.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const popoverContentProps = {
    side: RAIL_POPOVER_SIDE,
    align: RAIL_POPOVER_ALIGN,
    sideOffset: RAIL_POPOVER_OFFSET,
    collisionPadding: RAIL_POPOVER_COLLISION,
  }

  const scheduleEditor = (
    <TaskScheduleFields
      startAt={values.startAt}
      endAt={values.endAt}
      deadlinePriority={values.deadlinePriority}
      onStartChange={(startAt) => onChange({ startAt })}
      onEndChange={(endAt) => onChange({
        endAt,
        ...(endAt ? {} : { deadlinePriority: false }),
      })}
      onDeadlinePriorityChange={
        scheduleDisabled
          ? undefined
          : (deadlinePriority) => onChange({ deadlinePriority })
      }
      disabled={scheduleDisabled}
      compact
    />
  )

  const assigneesEditor = showAssignees ? (
    <TaskAssigneeEditor
      className="w-full min-w-0"
      options={assigneeOptions}
      value={values.assigneeIds}
      onChange={(assigneeIds) => onChange({ assigneeIds })}
      assignees={assignees}
      taskId={taskId}
      disabled={assigneesDisabled}
      placeholder="Søk etter medlem…"
      variant="rail"
    />
  ) : null

  return (
    <div className={cn('flex flex-col', isView ? 'gap-0.5' : 'gap-3')}>
      {statuses.length > 0 && (
        <PropertySection isSection={isSection}>
          <TaskPropertyRow icon={CircleDot} label="Status" variant={rowVariant}>
            {isView && !statusDisabled ? (
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className={RAIL_TRIGGER}>
                    {statusLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  {...popoverContentProps}
                  className="w-60 p-3"
                >
                  {statusSelect('bottom')}
                </PopoverContent>
              </Popover>
            ) : isView ? (
              <span className="px-1 py-0.5">{statusLabel}</span>
            ) : (
              statusSelect('left')
            )}
          </TaskPropertyRow>
        </PropertySection>
      )}

      <PropertySection isSection={isSection}>
        <TaskPropertyRow icon={Calendar} label="Tidsrom" variant={rowVariant}>
          {isView && !scheduleDisabled ? (
            <Popover
              open={scheduleOpen}
              onOpenChange={(open) => {
                setScheduleOpen(open)
                if (!open) onScheduleCommit?.()
              }}
            >
              <PopoverTrigger asChild>
                <button type="button" className={RAIL_TRIGGER}>
                  <span className="block leading-snug">{scheduleDisplay}</span>
                  {scheduleHint !== scheduleDisplay && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {scheduleHint}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                {...popoverContentProps}
                className="w-[min(20rem,calc(100vw-2.5rem))] p-4"
              >
                {scheduleEditor}
              </PopoverContent>
            </Popover>
          ) : isView ? (
            <div className="px-1 py-0.5">
              <span className="block leading-snug">{scheduleDisplay}</span>
              {scheduleHint !== scheduleDisplay && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {scheduleHint}
                </span>
              )}
            </div>
          ) : (
            scheduleEditor
          )}
        </TaskPropertyRow>
      </PropertySection>

      <PropertySection isSection={isSection}>
        <TaskPropertyRow icon={Folder} label="Gruppe" variant={rowVariant}>
          {isView && !groupDisabled ? (
            <Popover open={groupOpen} onOpenChange={setGroupOpen}>
              <PopoverTrigger asChild>
                <button type="button" className={RAIL_TRIGGER}>
                  {groupLabel}
                </button>
              </PopoverTrigger>
              <PopoverContent
                {...popoverContentProps}
                className="w-60 p-3"
              >
                {groupSelect('bottom')}
              </PopoverContent>
            </Popover>
          ) : isView ? (
            <span className="px-1 py-0.5">{groupLabel}</span>
          ) : (
            groupSelect('left')
          )}
        </TaskPropertyRow>
      </PropertySection>

      {showAssignees && (
        <PropertySection isSection={isSection}>
          <TaskPropertyRow icon={Users} label="Ansvarlige" variant={rowVariant}>
            {isView && !assigneesDisabled ? (
              <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className={RAIL_TRIGGER}>
                    <AssigneeRailValue assignees={assignees} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  {...popoverContentProps}
                  className="w-[min(20rem,calc(100vw-2.5rem))] p-4"
                  onOpenAutoFocus={(event) => event.preventDefault()}
                >
                  {assigneesEditor}
                </PopoverContent>
              </Popover>
            ) : isView ? (
              <div className="px-1 py-0.5">
                <AssigneeRailValue assignees={assignees} />
              </div>
            ) : (
              assigneesEditor
            )}
          </TaskPropertyRow>
        </PropertySection>
      )}
    </div>
  )
}
