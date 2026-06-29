'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskPropertyRowProps {
  icon: LucideIcon
  label: string
  children: React.ReactNode
  onClick?: () => void
  interactive?: boolean
  className?: string
  /** Tighter row in view mode; section adds card padding in edit/create. */
  variant?: 'default' | 'section'
}

export function TaskPropertyRow({
  icon: Icon,
  label,
  children,
  onClick,
  interactive = false,
  className,
  variant = 'default',
}: TaskPropertyRowProps) {
  const Comp = interactive ? 'button' : 'div'
  const isSection = variant === 'section'

  return (
    <Comp
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 text-left',
        isSection ? 'px-0 py-0' : 'rounded-lg px-1 py-2.5',
        interactive && !isSection && 'cursor-pointer hover:bg-muted/60 transition-colors',
        className,
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0 text-muted-foreground',
          isSection ? 'mt-1' : 'mt-0.5',
        )}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="min-w-0 text-sm">{children}</div>
      </div>
    </Comp>
  )
}
