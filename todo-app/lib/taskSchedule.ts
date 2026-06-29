import { differenceInCalendarDays, format, startOfDay } from 'date-fns'
import { nb } from 'date-fns/locale'

export function parseTaskDateTime(
  value: string | Date | null | undefined,
): Date | undefined {
  if (value == null || value === '') return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function serializeTaskDateTime(
  value: Date | undefined | null,
): string | null {
  if (!value) return null
  return value.toISOString()
}

export function formatTaskDateTime(
  value: string | Date | null | undefined,
): string {
  const date = parseTaskDateTime(value)
  if (!date) return '–'
  return format(date, "d. MMM yyyy 'kl.' HH:mm", { locale: nb })
}

/** Compact one-line range for property rails, e.g. "12. apr 09:00 → 15. apr 17:00". */
export function formatTaskScheduleRange(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined,
): string {
  const start = parseTaskDateTime(startAt)
  const end = parseTaskDateTime(endAt)
  const compact = (date: Date) => format(date, 'd. MMM HH:mm', { locale: nb })

  if (!start && !end) return 'Ikke satt'
  if (start && end) return `${compact(start)} → ${compact(end)}`
  if (start) return `Fra ${compact(start)}`
  return `Frist ${compact(end!)}`
}

function formatRelativeEndLabel(end: Date): string {
  const today = startOfDay(new Date())
  const endDay = startOfDay(end)
  const diffDays = differenceInCalendarDays(endDay, today)

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays)
    return overdue === 1 ? '1 dag siden' : `${overdue} dager siden`
  }
  if (diffDays === 0) return 'I dag'
  if (diffDays === 1) return 'I morgen'
  if (diffDays <= 7) return `${diffDays} dager igjen`

  return format(end, 'd. MMM yyyy', { locale: nb })
}

function formatRelativeStartLabel(start: Date): string {
  const today = startOfDay(new Date())
  const startDay = startOfDay(start)
  const diffDays = differenceInCalendarDays(startDay, today)

  if (diffDays === 0) return 'Starter i dag'
  if (diffDays === 1) return 'Starter i morgen'
  if (diffDays <= 7) return `Starter om ${diffDays} dager`

  return `Starter ${format(start, 'd. MMM yyyy', { locale: nb })}`
}

export function formatTaskScheduleLabel(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined,
): string {
  const now = new Date()
  const start = parseTaskDateTime(startAt)
  const end = parseTaskDateTime(endAt)

  if (start && start > now) {
    return formatRelativeStartLabel(start)
  }

  if (!end) return 'Ingen frist'
  return formatRelativeEndLabel(end)
}

/** @deprecated Prefer formatTaskScheduleLabel */
export function formatTaskEndLabel(
  endAt: string | Date | null | undefined,
): string {
  return formatTaskScheduleLabel(undefined, endAt)
}

export function mergeDateAndTime(
  date: Date | undefined,
  time: string,
): Date | undefined {
  if (!date) return undefined
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  const merged = new Date(date)
  merged.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return merged
}

export function extractTimeFromDate(
  date: Date | undefined,
  fallback: string,
): string {
  if (!date) return fallback
  return format(date, 'HH:mm')
}
