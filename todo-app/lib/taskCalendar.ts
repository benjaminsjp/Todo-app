import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { nb } from 'date-fns/locale'

import type { Task } from '@/lib/types'

export type CalendarFilterMode = 'org' | 'mine'

export type CalendarViewMode = 'week' | 'month'

export type MonthCalendarWeek = {
  weekIndex: number
  days: Date[]
}

export type WeekTaskPlacement = {
  task: Task
  startCol: number
  endCol: number
  span: number
}

export type WeekTaskLane = WeekTaskPlacement & {
  lane: number
}

export type TimedTaskBlock = {
  task: Task
  col: number
  top: number
  height: number
  lane: number
  laneCount: number
}

export const CALENDAR_START_HOUR = 0
export const CALENDAR_END_HOUR = 24
export const CALENDAR_HOUR_HEIGHT = 56
export const CALENDAR_MIN_BLOCK_HEIGHT = 28

export function getCalendarHours(): number[] {
  return Array.from(
    { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
    (_, index) => CALENDAR_START_HOUR + index,
  )
}

export function getCalendarGridHeight(): number {
  return (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT
}

export function parseCalendarWeek(value: string | undefined): Date {
  if (!value) return startOfWeek(new Date(), { weekStartsOn: 1 })
  const parsed = parseISO(value)
  if (Number.isNaN(parsed.getTime())) {
    return startOfWeek(new Date(), { weekStartsOn: 1 })
  }
  return startOfWeek(parsed, { weekStartsOn: 1 })
}

export function formatCalendarWeekParam(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function getCalendarWeekDays(anchor: Date): Date[] {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

export function getCalendarWeekRangeLabel(anchor: Date): string {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 })
  return `${format(weekStart, 'd. MMM', { locale: nb })} - ${format(weekEnd, 'd. MMM yyyy', { locale: nb })}`
}

export function parseCalendarView(value: string | undefined): CalendarViewMode {
  return value === 'month' ? 'month' : 'week'
}

export function parseCalendarMonth(value: string | undefined): Date {
  if (!value) return startOfMonth(new Date())
  const parsed = parseISO(`${value}-01`)
  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date())
  }
  return startOfMonth(parsed)
}

export function formatCalendarMonthParam(date: Date): string {
  return format(startOfMonth(date), 'yyyy-MM')
}

export function getCalendarMonthLabel(anchor: Date): string {
  return format(startOfMonth(anchor), 'MMMM yyyy', { locale: nb })
}

export function getCalendarMonthWeeks(monthAnchor: Date): MonthCalendarWeek[] {
  const monthStart = startOfMonth(monthAnchor)
  const monthEnd = endOfMonth(monthAnchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const weeks: MonthCalendarWeek[] = []
  let current = gridStart
  let weekIndex = 0

  while (current <= gridEnd) {
    weeks.push({
      weekIndex,
      days: Array.from({ length: 7 }, (_, index) => addDays(current, index)),
    })
    current = addDays(current, 7)
    weekIndex += 1
  }

  return weeks
}

export function getAdjacentCalendarMonths(anchor: Date) {
  return {
    prev: formatCalendarMonthParam(subMonths(startOfMonth(anchor), 1)),
    next: formatCalendarMonthParam(addMonths(startOfMonth(anchor), 1)),
  }
}

export function isDayInCalendarMonth(day: Date, monthAnchor: Date): boolean {
  return isSameMonth(day, monthAnchor)
}

export function taskHasCalendarDate(task: Task): boolean {
  return Boolean(task.startAt || task.endAt)
}

export function filterCalendarTasks(tasks: Task[], mode: CalendarFilterMode, userId: string): Task[] {
  return tasks.filter((task) => {
    if (!taskHasCalendarDate(task)) return false
    if (mode === 'org') return true
    return (task.assignees ?? []).some((user) => user.id === userId)
  })
}

export function filterCalendarTasksByGroup(
  tasks: Task[],
  groupParam: string | undefined,
): Task[] {
  if (!groupParam || groupParam === 'all') return tasks
  if (groupParam === 'none') return tasks.filter((task) => !task.groupId)
  const groupId = Number(groupParam)
  if (Number.isNaN(groupId)) return tasks
  return tasks.filter((task) => task.groupId === groupId)
}

export function taskOccursOnDay(task: Task, day: Date): boolean {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)

  if (task.startAt && task.endAt) {
    const taskStart = startOfDay(new Date(task.startAt))
    const taskEnd = endOfDay(new Date(task.endAt))
    return taskStart <= dayEnd && taskEnd >= dayStart
  }

  const anchor = task.startAt ?? task.endAt
  if (!anchor) return false

  return isWithinInterval(new Date(anchor), {
    start: dayStart,
    end: dayEnd,
  })
}

export function getTasksForCalendarDay(tasks: Task[], day: Date): Task[] {
  return tasks.filter((task) => taskOccursOnDay(task, day))
}

export function getCalendarSpanDays(task: Task): number {
  if (!task.startAt || !task.endAt) return 1
  const days = eachDayOfInterval({
    start: startOfDay(new Date(task.startAt)),
    end: startOfDay(new Date(task.endAt)),
  })
  return Math.max(days.length, 1)
}

/** Column placement for a task within the visible week (0-indexed). */
export function getTaskWeekPlacement(task: Task, days: Date[]): WeekTaskPlacement | null {
  if (days.length === 0) return null

  let startCol = -1
  let endCol = -1

  days.forEach((day, index) => {
    if (!taskOccursOnDay(task, day)) return
    if (startCol === -1) startCol = index
    endCol = index
  })

  if (startCol === -1 || endCol === -1) return null

  return {
    task,
    startCol,
    endCol,
    span: endCol - startCol + 1,
  }
}

export function isMultiDayWeekTask(placement: WeekTaskPlacement): boolean {
  return placement.span > 1
}

/** Stack overlapping multi-day bars into lanes. */
export function assignMultiDayLanes(placements: WeekTaskPlacement[]): WeekTaskLane[] {
  const multiDay = placements.filter(isMultiDayWeekTask)
  const laneEnds: number[] = []
  const result: WeekTaskLane[] = []

  const sorted = [...multiDay].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol
    return b.span - a.span
  })

  for (const placement of sorted) {
    let lane = laneEnds.findIndex((endCol) => endCol < placement.startCol)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(placement.endCol)
    } else {
      laneEnds[lane] = placement.endCol
    }
    result.push({ ...placement, lane })
  }

  return result
}

export function splitWeekTasksByLayout(tasks: Task[], days: Date[]) {
  const placements = tasks
    .map((task) => getTaskWeekPlacement(task, days))
    .filter((placement): placement is WeekTaskPlacement => placement !== null)

  const multiDayLanes = assignMultiDayLanes(placements)
  const multiDayTaskIds = new Set(multiDayLanes.map((entry) => entry.task.id))

  const singleDayByCol = days.map((day, col) => ({
    day,
    col,
    tasks: placements
      .filter((placement) => placement.startCol === col && !multiDayTaskIds.has(placement.task.id))
      .map((placement) => placement.task),
  }))

  return { multiDayLanes, singleDayByCol }
}

export function formatCalendarTaskTime(task: Task): string | null {
  const start = task.startAt ? new Date(task.startAt) : null
  const end = task.endAt ? new Date(task.endAt) : null

  if (start && end) {
    const sameDay =
      differenceInCalendarDays(startOfDay(start), startOfDay(end)) === 0
    if (sameDay) {
      return `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`
    }
    return `${format(start, 'd. MMM HH:mm', { locale: nb })} – ${format(end, 'd. MMM HH:mm', { locale: nb })}`
  }

  const anchor = start ?? end
  if (!anchor) return null
  return format(anchor, 'HH:mm')
}

function isSingleCalendarDayTask(task: Task): boolean {
  if (!task.startAt || !task.endAt) return true
  return (
    differenceInCalendarDays(
      startOfDay(new Date(task.startAt)),
      startOfDay(new Date(task.endAt)),
    ) === 0
  )
}

/** Time range for a task on a specific day (single-day tasks only). */
export function getTaskDayTimeRange(
  task: Task,
  day: Date,
): { start: Date; end: Date } | null {
  if (!taskOccursOnDay(task, day)) return null
  if (!isSingleCalendarDayTask(task)) return null

  const taskStart = task.startAt ? new Date(task.startAt) : null
  const taskEnd = task.endAt ? new Date(task.endAt) : null

  let start: Date
  let end: Date

  if (taskStart && taskEnd) {
    start = taskStart
    end = taskEnd
  } else if (taskStart) {
    start = taskStart
    end = new Date(taskStart.getTime() + 60 * 60 * 1000)
  } else if (taskEnd) {
    end = taskEnd
    start = new Date(taskEnd.getTime() - 60 * 60 * 1000)
  } else {
    return null
  }

  if (end <= start) {
    end = new Date(start.getTime() + 30 * 60 * 1000)
  }

  return { start, end }
}

export function dateToCalendarOffset(date: Date): number {
  const totalMinutes =
    (date.getHours() - CALENDAR_START_HOUR) * 60 + date.getMinutes()
  const maxMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60
  const clamped = Math.max(0, Math.min(totalMinutes, maxMinutes))
  return (clamped / 60) * CALENDAR_HOUR_HEIGHT
}

export function minutesToCalendarHeight(minutes: number): number {
  return Math.max(
    (minutes / 60) * CALENDAR_HOUR_HEIGHT,
    CALENDAR_MIN_BLOCK_HEIGHT,
  )
}

function timedBlocksOverlap(
  a: { top: number; height: number },
  b: { top: number; height: number },
): boolean {
  return a.top < b.top + b.height && b.top < a.top + a.height
}

export function assignTimedTaskLanes(
  blocks: Omit<TimedTaskBlock, 'lane' | 'laneCount'>[],
): TimedTaskBlock[] {
  const byCol = new Map<number, Omit<TimedTaskBlock, 'lane' | 'laneCount'>[]>()

  for (const block of blocks) {
    const colBlocks = byCol.get(block.col) ?? []
    colBlocks.push(block)
    byCol.set(block.col, colBlocks)
  }

  const result: TimedTaskBlock[] = []

  for (const [, colBlocks] of byCol) {
    const sorted = [...colBlocks].sort((a, b) => a.top - b.top || b.height - a.height)
    const lanes: { top: number; height: number }[][] = []
    const laneByKey = new Map<string, number>()

    for (const block of sorted) {
      let laneIndex = lanes.findIndex((lane) =>
        lane.every((existing) => !timedBlocksOverlap(existing, block)),
      )

      if (laneIndex === -1) {
        laneIndex = lanes.length
        lanes.push([])
      }

      lanes[laneIndex].push({ top: block.top, height: block.height })
      laneByKey.set(`${block.task.id}-${block.col}`, laneIndex)
    }

    const laneCount = Math.max(lanes.length, 1)

    for (const block of colBlocks) {
      result.push({
        ...block,
        lane: laneByKey.get(`${block.task.id}-${block.col}`) ?? 0,
        laneCount,
      })
    }
  }

  return result
}

export function buildTimedTaskBlocks(tasks: Task[], days: Date[]): TimedTaskBlock[] {
  const multiDayIds = new Set(
    tasks
      .map((task) => getTaskWeekPlacement(task, days))
      .filter((placement): placement is WeekTaskPlacement => placement !== null)
      .filter(isMultiDayWeekTask)
      .map((placement) => placement.task.id),
  )

  const rawBlocks: Omit<TimedTaskBlock, 'lane' | 'laneCount'>[] = []

  days.forEach((day, col) => {
    for (const task of tasks) {
      if (multiDayIds.has(task.id)) continue

      const range = getTaskDayTimeRange(task, day)
      if (!range) continue

      const gridStart = new Date(day)
      gridStart.setHours(CALENDAR_START_HOUR, 0, 0, 0)
      const gridEnd = new Date(day)
      gridEnd.setHours(CALENDAR_END_HOUR, 0, 0, 0)

      const clampedStart = range.start < gridStart ? gridStart : range.start
      const clampedEnd = range.end > gridEnd ? gridEnd : range.end
      if (clampedEnd <= clampedStart) continue

      const top = dateToCalendarOffset(clampedStart)
      const durationMinutes = (clampedEnd.getTime() - clampedStart.getTime()) / 60000
      const height = minutesToCalendarHeight(durationMinutes)

      if (top >= getCalendarGridHeight()) continue

      rawBlocks.push({
        task,
        col,
        top,
        height: Math.min(height, getCalendarGridHeight() - top),
      })
    }
  })

  return assignTimedTaskLanes(rawBlocks)
}

export function splitWeekTasksForTimeGrid(tasks: Task[], days: Date[]) {
  const placements = tasks
    .map((task) => getTaskWeekPlacement(task, days))
    .filter((placement): placement is WeekTaskPlacement => placement !== null)

  const multiDayLanes = assignMultiDayLanes(placements)
  const timedBlocks = buildTimedTaskBlocks(tasks, days)

  return { multiDayLanes, timedBlocks }
}
