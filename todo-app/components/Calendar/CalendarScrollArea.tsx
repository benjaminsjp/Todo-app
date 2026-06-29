'use client'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface CalendarScrollAreaProps {
  header: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

/** Card shell with fixed header; only the body scrolls (vertical + optional horizontal). */
export function CalendarScrollArea({
  header,
  children,
  className,
  contentClassName,
}: CalendarScrollAreaProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card',
        className,
      )}
    >
      <div className="shrink-0 border-b bg-card">{header}</div>
      <ScrollArea className="min-h-0 flex-1">
        <div className={contentClassName}>{children}</div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
