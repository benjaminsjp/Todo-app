'use client'

import { memo, useMemo } from 'react'
import { format, isToday } from 'date-fns'

import { CalendarTaskHoverCard } from '@/components/Calendar/CalendarTaskHoverCard'
import { CalendarScrollArea } from '@/components/Calendar/CalendarScrollArea'
import {
  getCalendarTaskBlockClassName,
} from '@/components/Calendar/calendarTaskStyles'
import {
  formatCalendarTaskTime,
  isDayInCalendarMonth,
  splitWeekTasksByLayout,
  type MonthCalendarWeek,
  type WeekTaskLane,
} from '@/lib/taskCalendar'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskMonthCalendarProps {
  monthAnchor: Date
  weeks: MonthCalendarWeek[]
  tasks: Task[]
  orgSlug: string
  canEdit?: boolean
}

const WEEKDAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const MAX_VISIBLE_TASKS = 3
const SPAN_LANE_HEIGHT = 22

const monthCellBorder = 'border-r border-border/60'

function monthCellBackground(inMonth: boolean) {
  return !inMonth ? 'bg-muted/25' : undefined
}

function MonthDateLabel({
  day,
  monthAnchor,
}: {
  day: Date
  monthAnchor: Date
}) {
  const inMonth = isDayInCalendarMonth(day, monthAnchor)

  return (
    <div className="flex justify-end">
      <span
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
          isToday(day) && inMonth && 'bg-primary font-medium text-primary-foreground',
          inMonth && !isToday(day) && 'text-foreground',
          !inMonth && 'text-muted-foreground/60',
        )}
      >
        {format(day, 'd')}
      </span>
    </div>
  )
}

function MonthSpanLaneRow({
  week,
  monthAnchor,
  entries,
  orgSlug,
  canEdit = true,
  gridRow,
}: {
  week: MonthCalendarWeek
  monthAnchor: Date
  entries: WeekTaskLane[]
  orgSlug: string
  canEdit?: boolean
  gridRow: number
}) {
  return (
    <div
      className="grid grid-cols-7"
      style={{ gridColumn: '1 / -1', gridRow, minHeight: SPAN_LANE_HEIGHT }}
    >
      {week.days.map((day, col) => {
        const inMonth = isDayInCalendarMonth(day, monthAnchor)
        return (
          <div
            key={`lane-bg-${day.toISOString()}`}
            className={cn(monthCellBorder, monthCellBackground(inMonth))}
            style={{ gridColumn: col + 1, gridRow: 1 }}
          />
        )
      })}

      {entries.map((entry) => (
        <CalendarTaskHoverCard
          key={`${entry.task.id}-${week.weekIndex}`}
          task={entry.task}
          orgSlug={orgSlug}
          canEdit={canEdit}
          style={{
            gridColumn: `${entry.startCol + 1} / span ${entry.span}`,
            gridRow: 1,
            height: SPAN_LANE_HEIGHT,
          }}
          className={cn(
            'z-10 flex min-w-0 items-center rounded px-1.5 text-[11px] leading-tight transition-colors',
            getCalendarTaskBlockClassName(entry.task),
          )}
        >
          <span className="truncate font-medium">{entry.task.title}</span>
        </CalendarTaskHoverCard>
      ))}

      {week.days.map((day, col) => {
        if (isDayInCalendarMonth(day, monthAnchor)) return null
        return (
          <div
            key={`lane-mask-${day.toISOString()}`}
            className={cn(
              monthCellBorder,
              'pointer-events-none z-20 bg-muted/25',
            )}
            style={{ gridColumn: col + 1, gridRow: 1 }}
          />
        )
      })}
    </div>
  )
}

function MonthSingleDayTasks({
  tasks,
  orgSlug,
  canEdit = true,
}: {
  tasks: Task[]
  orgSlug: string
  canEdit?: boolean
}) {
  const visible = tasks.slice(0, MAX_VISIBLE_TASKS)
  const overflow = tasks.length - visible.length

  return (
    <div className="flex flex-col gap-0.5">
      {visible.map((task) => {
        const timeLabel = formatCalendarTaskTime(task)
        return (
          <CalendarTaskHoverCard
            key={task.id}
            task={task}
            orgSlug={orgSlug}
            canEdit={canEdit}
            className={cn(
              'block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight transition-colors',
              getCalendarTaskBlockClassName(task),
            )}
          >
            <span className="font-medium">{task.title}</span>
            {timeLabel && (
              <span className="ml-1 text-[10px] text-muted-foreground">{timeLabel}</span>
            )}
          </CalendarTaskHoverCard>
        )
      })}
      {overflow > 0 && (
        <span className="px-1.5 text-[10px] text-muted-foreground">+{overflow} til</span>
      )}
    </div>
  )
}

const MonthWeekRow = memo(function MonthWeekRow({
  week,
  monthAnchor,
  tasks,
  orgSlug,
  canEdit = true,
}: {
  week: MonthCalendarWeek
  monthAnchor: Date
  tasks: Task[]
  orgSlug: string
  canEdit?: boolean
}) {
  const { multiDayLanes, singleDayByCol } = useMemo(
    () => splitWeekTasksByLayout(tasks, week.days),
    [tasks, week.days],
  )
  const laneCount = multiDayLanes.reduce((max, entry) => Math.max(max, entry.lane + 1), 0)
  const singleDayRow = 2 + laneCount

  const gridTemplateRows =
    laneCount > 0
      ? `auto repeat(${laneCount}, ${SPAN_LANE_HEIGHT}px) minmax(4rem, auto)`
      : 'auto minmax(4rem, auto)'

  return (
    <div
      className="grid min-h-28 grid-cols-7 border-b last:border-b-0"
      style={{ gridTemplateRows }}
    >
      {week.days.map((day, col) => {
        const inMonth = isDayInCalendarMonth(day, monthAnchor)
        return (
          <div
            key={`date-${day.toISOString()}`}
            className={cn(
              monthCellBorder,
              'px-1.5 pt-1.5',
              laneCount > 0 && 'pb-0.5',
              monthCellBackground(inMonth),
            )}
            style={{ gridColumn: col + 1, gridRow: 1 }}
          >
            <MonthDateLabel day={day} monthAnchor={monthAnchor} />
          </div>
        )
      })}

      {laneCount > 0 &&
        Array.from({ length: laneCount }, (_, lane) => (
          <MonthSpanLaneRow
            key={`lane-${lane}`}
            week={week}
            monthAnchor={monthAnchor}
            entries={multiDayLanes.filter((entry) => entry.lane === lane)}
            orgSlug={orgSlug}
            canEdit={canEdit}
            gridRow={lane + 2}
          />
        ))}

      {singleDayByCol.map(({ day, col, tasks: dayTasks }) => {
        const inMonth = isDayInCalendarMonth(day, monthAnchor)
        return (
          <div
            key={`tasks-${day.toISOString()}`}
            className={cn(
              monthCellBorder,
              'px-1.5 pb-1.5 pt-0.5',
              monthCellBackground(inMonth),
            )}
            style={{ gridColumn: col + 1, gridRow: singleDayRow }}
          >
            <MonthSingleDayTasks tasks={dayTasks} orgSlug={orgSlug} canEdit={canEdit} />
          </div>
        )
      })}
    </div>
  )
})

export const TaskMonthCalendar = memo(function TaskMonthCalendar({
  monthAnchor,
  weeks,
  tasks,
  orgSlug,
  canEdit = true,
}: TaskMonthCalendarProps) {
  return (
    <CalendarScrollArea
      className="min-h-0 flex-1"
      contentClassName="min-w-[48rem]"
      header={
        <div className="grid grid-cols-7">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-r px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>
      }
    >
      {weeks.map((week) => (
        <MonthWeekRow
          key={week.weekIndex}
          week={week}
          monthAnchor={monthAnchor}
          tasks={tasks}
          orgSlug={orgSlug}
          canEdit={canEdit}
        />
      ))}
    </CalendarScrollArea>
  )
})
