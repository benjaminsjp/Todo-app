import { getColor } from '@/lib/types'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'

const FALLBACK_BLOCK =
  'border border-border/80 bg-muted/40 hover:bg-muted/55'

export function getCalendarTaskBlockClassName(task: Task): string {
  const colorKey = task.group?.color
  if (!colorKey) return FALLBACK_BLOCK

  const palette = getColor(colorKey)
  return cn('border', palette.border, palette.opacity, 'hover:brightness-[0.97]')
}

export function getCalendarTaskTooltip(task: Task): string {
  const parts = [task.title]
  if (task.group?.title) parts.push(task.group.title)
  return parts.join(' · ')
}
