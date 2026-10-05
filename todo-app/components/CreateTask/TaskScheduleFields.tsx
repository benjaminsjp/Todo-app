'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronDownIcon, Pin, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  extractTimeFromDate,
  mergeDateAndTime,
  parseTaskDateTime,
} from '@/lib/taskSchedule'
import { cn } from '@/lib/utils'

interface TaskDateTimeFieldProps {
  label: string
  value?: Date
  onChange: (value: Date | undefined) => void
  disabled?: boolean
  defaultTime?: string
  className?: string
  compact?: boolean
}

function TaskDateTimeField({
  label,
  value,
  onChange,
  disabled = false,
  defaultTime = '17:00',
  className,
  compact = false,
}: TaskDateTimeFieldProps) {
  const [open, setOpen] = React.useState(false)
  const [time, setTime] = React.useState(() =>
    extractTimeFromDate(value, defaultTime),
  )

  React.useEffect(() => {
    setTime(extractTimeFromDate(value, defaultTime))
  }, [value, defaultTime])

  const dateOnly = value
    ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
    : undefined

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined)
      return
    }
    onChange(mergeDateAndTime(selectedDate, time || defaultTime))
  }

  const handleTimeChange = (nextTime: string) => {
    setTime(nextTime)
    if (!dateOnly) return
    onChange(mergeDateAndTime(dateOnly, nextTime))
  }

  const handleClear = () => {
    setTime(defaultTime)
    onChange(undefined)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={cn('flex gap-2', compact ? 'flex-col' : 'items-center')}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              data-empty={!value}
              className={cn(
                'justify-between text-left font-normal data-[empty=true]:text-muted-foreground',
                compact ? 'h-10 w-full' : 'min-w-0 flex-1',
              )}
            >
              <span
                className={cn(
                  'flex items-center gap-2',
                  compact ? 'min-w-0' : 'min-w-0 truncate',
                )}
              >
                <CalendarIcon className="size-4 shrink-0" />
                <span className={compact ? 'whitespace-nowrap' : 'truncate'}>
                  {value
                    ? format(value, 'd. MMM yyyy', { locale: nb })
                    : 'Velg dato'}
                </span>
              </span>
              <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="start"
            side={compact ? 'left' : 'bottom'}
            sideOffset={compact ? 12 : 4}
            collisionPadding={16}
          >
            <Calendar
              mode="single"
              selected={dateOnly}
              defaultMonth={dateOnly}
              onSelect={(selectedDate) => {
                handleDateSelect(selectedDate)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>

        <div className={cn('flex items-center gap-2', compact && 'w-full')}>
          <Input
            type="time"
            value={time}
            onChange={(event) => handleTimeChange(event.target.value)}
            disabled={disabled || !value}
            className={cn(
              'shrink-0 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
              compact ? 'h-10 flex-1' : 'w-[7.5rem]',
            )}
          />

          {value && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              aria-label={`Fjern ${label.toLowerCase()}`}
              onClick={handleClear}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface TaskScheduleFieldsProps {
  startAt?: Date
  endAt?: Date
  deadlinePriority?: boolean
  onStartChange?: (value: Date | undefined) => void
  onEndChange?: (value: Date | undefined) => void
  onDeadlinePriorityChange?: (value: boolean) => void
  disabled?: boolean
  className?: string
  compact?: boolean
}

export function TaskScheduleFields({
  startAt,
  endAt,
  deadlinePriority = false,
  onStartChange,
  onEndChange,
  onDeadlinePriorityChange,
  disabled = false,
  className,
  compact = false,
}: TaskScheduleFieldsProps) {
  const handleEndChange = (value: Date | undefined) => {
    onEndChange?.(value)
    if (!value) onDeadlinePriorityChange?.(false)
  }

  const priorityDisabled =
    disabled || !onDeadlinePriorityChange || !endAt

  return (
    <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-3', className)}>
      <TaskDateTimeField
        label="Start"
        value={startAt}
        onChange={onStartChange ?? (() => {})}
        disabled={disabled || !onStartChange}
        defaultTime="09:00"
        compact={compact}
      />
      <TaskDateTimeField
        label="Frist"
        value={endAt}
        onChange={handleEndChange}
        disabled={disabled || !onEndChange}
        defaultTime="17:00"
        compact={compact}
      />
      {(onDeadlinePriorityChange || deadlinePriority) && (
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant={deadlinePriority ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'justify-start gap-2',
              compact ? 'w-full' : 'w-fit',
              !endAt && 'opacity-60',
            )}
            disabled={priorityDisabled}
            aria-pressed={deadlinePriority}
            onClick={() => onDeadlinePriorityChange?.(!deadlinePriority)}
          >
            <Pin className={cn('size-3.5', deadlinePriority && 'fill-current')} />
            {deadlinePriority ? 'Prioritet på' : 'Prioritet'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Prioriterte frister vises øverst på forsiden.
          </p>
        </div>
      )}
    </div>
  )
}

export function parseScheduleFormValue(
  value: FormDataEntryValue | null,
): Date | null {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return null
  const parsed = parseTaskDateTime(raw)
  return parsed ?? null
}
