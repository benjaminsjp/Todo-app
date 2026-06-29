import { format, isToday } from 'date-fns'
import { nb } from 'date-fns/locale'

import { CalendarTaskHoverCard } from '@/components/Calendar/CalendarTaskHoverCard'
import {
  getCalendarTaskBlockClassName,
} from '@/components/Calendar/calendarTaskStyles'
import { CalendarScrollArea } from '@/components/Calendar/CalendarScrollArea'
import {
  CALENDAR_HOUR_HEIGHT,
  CALENDAR_START_HOUR,
  formatCalendarTaskTime,
  getCalendarGridHeight,
  getCalendarHours,
  splitWeekTasksForTimeGrid,
  type TimedTaskBlock,
} from '@/lib/taskCalendar'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskWeekCalendarProps {
  days: Date[]
  tasks: Task[]
  orgSlug: string
}

const LANE_HEIGHT = 28
const LANE_GAP = 4
const TIME_GUTTER = '3.5rem'
const GRID_HEIGHT = getCalendarGridHeight()
const HOURS = getCalendarHours()

function SpanBar({
  task,
  orgSlug,
  startCol,
  span,
  lane,
}: {
  task: Task
  orgSlug: string
  startCol: number
  span: number
  lane: number
}) {
  const timeLabel = formatCalendarTaskTime(task)

  return (
    <CalendarTaskHoverCard
      task={task}
      orgSlug={orgSlug}
      style={{
        gridColumn: `${startCol + 1} / span ${span}`,
        gridRow: lane + 1,
      }}
      className={cn(
        'mx-1 flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
        getCalendarTaskBlockClassName(task),
      )}
    >
      <span className="truncate font-medium">{task.title}</span>
      {timeLabel && (
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {timeLabel}
        </span>
      )}
    </CalendarTaskHoverCard>
  )
}

function TimedBlock({
  block,
  orgSlug,
}: {
  block: TimedTaskBlock
  orgSlug: string
}) {
  const timeLabel = formatCalendarTaskTime(block.task)
  const widthPercent = 100 / block.laneCount
  const leftPercent = block.lane * widthPercent

  return (
    <CalendarTaskHoverCard
      task={block.task}
      orgSlug={orgSlug}
      style={{
        top: block.top,
        height: block.height,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
      }}
      className={cn(
        'absolute z-10 overflow-hidden rounded-md px-1.5 py-1 text-xs transition-colors hover:z-20 hover:brightness-[0.97]',
        getCalendarTaskBlockClassName(block.task),
      )}
    >
      <p className="truncate font-medium leading-tight">{block.task.title}</p>
      {timeLabel && block.height >= 40 && (
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {timeLabel}
        </p>
      )}
    </CalendarTaskHoverCard>
  )
}

export function TaskWeekCalendar({
  days,
  tasks,
  orgSlug,
}: TaskWeekCalendarProps) {
  const { multiDayLanes, timedBlocks } = splitWeekTasksForTimeGrid(tasks, days)
  const laneCount = multiDayLanes.reduce((max, entry) => Math.max(max, entry.lane + 1), 0)
  const spanAreaHeight =
    laneCount > 0 ? laneCount * LANE_HEIGHT + (laneCount - 1) * LANE_GAP + 12 : 0

  const blocksByCol = days.map((_, col) =>
    timedBlocks.filter((block) => block.col === col),
  )

  return (
    <CalendarScrollArea
      className="min-h-0 flex-1"
      contentClassName="min-w-[56rem]"
      header={
        <div
          className="grid"
          style={{ gridTemplateColumns: `${TIME_GUTTER} repeat(7, minmax(0, 1fr))` }}
        >
          <div className="border-r bg-card" />
          {days.map((day, index) => (
            <div
              key={day.toISOString()}
              className={cn('px-3 py-3', index < days.length - 1 && 'border-r')}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {format(day, 'EEE', { locale: nb })}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    'text-xl font-medium tabular-nums',
                    isToday(day) &&
                      'inline-flex min-w-8 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-primary-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(day, 'MMM', { locale: nb })}
                </span>
              </div>
            </div>
          ))}
        </div>
      }
    >
      {laneCount > 0 && (
        <div
          className="grid border-b bg-muted/20"
          style={{ gridTemplateColumns: `${TIME_GUTTER} repeat(7, minmax(0, 1fr))` }}
        >
          <div className="flex items-center justify-end border-r px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Heldag
          </div>
          <div className="relative col-span-7 py-2">
            <div
              className="pointer-events-none absolute inset-0 grid grid-cols-7"
              aria-hidden
            >
              {days.map((day, index) => (
                <div
                  key={`allday-line-${day.toISOString()}`}
                  className={cn(index < days.length - 1 && 'border-r border-border/60')}
                />
              ))}
            </div>
            <div
              className="relative grid grid-cols-7 px-1"
              style={{
                gridTemplateRows: `repeat(${laneCount}, ${LANE_HEIGHT}px)`,
                gap: `${LANE_GAP}px 0`,
                minHeight: spanAreaHeight,
              }}
            >
              {multiDayLanes.map((entry) => (
                <SpanBar
                  key={entry.task.id}
                  task={entry.task}
                  orgSlug={orgSlug}
                  startCol={entry.startCol}
                  span={entry.span}
                  lane={entry.lane}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className="grid"
        style={{ gridTemplateColumns: `${TIME_GUTTER} repeat(7, minmax(0, 1fr))` }}
      >
        <div
          className="relative border-r bg-card"
          style={{ height: GRID_HEIGHT }}
        >
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
              style={{ top: (hour - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT }}
            >
              {format(new Date(2000, 0, 1, hour, 0), 'HH:mm')}
            </div>
          ))}
        </div>

        {days.map((day, col) => (
          <div
            key={day.toISOString()}
            className="relative border-r last:border-r-0"
            style={{ height: GRID_HEIGHT }}
          >
            {HOURS.map((hour) => (
              <div
                key={`${day.toISOString()}-${hour}`}
                className="absolute inset-x-0 border-t border-border/50"
                style={{ top: (hour - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT }}
              />
            ))}
            <div
              className="absolute inset-x-0 border-t border-border/50"
              style={{ top: GRID_HEIGHT }}
            />

            {blocksByCol[col]?.map((block) => (
              <TimedBlock
                key={`${block.task.id}-${block.col}`}
                block={block}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        ))}
      </div>
    </CalendarScrollArea>
  )
}
