'use client'

import { useState, type ReactNode } from 'react'
import { CircleDashed, CircleEllipsis } from 'lucide-react'
import { cn } from '@/lib/utils'

const TRANSITION =
  'transition-[opacity,transform] duration-[440ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150'

const PILL =
  'inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs whitespace-nowrap'

function TaskPill({ children }: { children: ReactNode }) {
  return <span className={PILL}>{children}</span>
}

function SwappingPillRow({
  before,
  after,
}: {
  before: ReactNode
  after: ReactNode
}) {
  return (
    <div className="relative mt-6 overflow-hidden">
      <div className="grid invisible [&>*]:col-start-1 [&>*]:row-start-1" aria-hidden>
        <div className="flex flex-wrap items-center gap-2">{before}</div>
        <div className="flex flex-wrap items-center gap-2">{after}</div>
      </div>

      <div
        className={cn(
          'landing-pill-row-before absolute inset-0 flex flex-wrap items-center gap-2',
          'origin-left will-change-transform',
        )}
      >
        {before}
      </div>

      <div
        className={cn(
          'landing-pill-row-after absolute inset-0 flex flex-wrap items-center gap-2',
          'origin-left will-change-transform',
        )}
      >
        {after}
      </div>
    </div>
  )
}

function SwappingComment({
  before,
  after,
  enterDelay = 0,
}: {
  before: ReactNode
  after: ReactNode
  enterDelay?: number
}) {
  return (
    <div className="relative mt-2 overflow-hidden">
      <div className="grid invisible [&>*]:col-start-1 [&>*]:row-start-1" aria-hidden>
        <p>{before}</p>
        <p>{after}</p>
      </div>
      <p
        className={cn(
          'absolute inset-0',
          TRANSITION,
          'opacity-100 translate-y-0 scale-100',
          'group-hover/task-card:opacity-0 group-hover/task-card:-translate-y-3 group-hover/task-card:scale-95',
          'motion-reduce:group-hover/task-card:translate-y-0 motion-reduce:group-hover/task-card:scale-100',
        )}
      >
        {before}
      </p>
      <p
        className={cn(
          'absolute inset-0',
          TRANSITION,
          'opacity-0 translate-y-4 scale-95',
          'group-hover/task-card:opacity-100 group-hover/task-card:translate-y-0 group-hover/task-card:scale-100',
          'group-hover/task-card:[transition-delay:var(--swap-enter-delay)]',
          'motion-reduce:group-hover/task-card:translate-y-0 motion-reduce:group-hover/task-card:scale-100',
        )}
        style={{ '--swap-enter-delay': `${enterDelay}ms` } as React.CSSProperties}
      >
        {after}
      </p>
    </div>
  )
}

const pillsBefore = (
  <>
    <TaskPill>
      <CircleDashed className="size-3.5 text-muted-foreground" />
      Todo
    </TaskPill>
    <TaskPill>
      <span className="size-2 rounded-full bg-violet-500" />
      Plan
    </TaskPill>
    <TaskPill>
      <span className="size-2 rounded-full bg-emerald-500" />
      Someone viewing
    </TaskPill>
  </>
)

const pillsAfter = (
  <>
    <TaskPill>
      <CircleEllipsis className="size-3.5 text-blue-600" />
      In Progress
    </TaskPill>
    <TaskPill>
      <span className="size-2 rounded-full bg-amber-500" />
      Sprint 12
    </TaskPill>
    <TaskPill>
      <span className="size-2 rounded-full bg-red-500" />
      Someone editing
    </TaskPill>
  </>
)

export function LandingTaskPreviewCard() {
  const [hovered, setHovered] = useState(false)
  const [animated, setAnimated] = useState(false)

  const commentBefore =
    'Outlined the REST shape for SSE — wants a quick review before we wire it up.'
  const commentAfter =
    'Pushed the presence indicator — red dot shows when a card is locked.'

  return (
    <div
      data-task-card
      data-hovered={hovered ? '' : undefined}
      data-animated={animated ? '' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setAnimated(true)
      }}
      onFocus={() => setHovered(true)}
      onBlur={() => {
        setHovered(false)
        setAnimated(true)
      }}
      className={cn(
        'group/task-card rounded-2xl border bg-card p-6 outline-none',
        'transition-[border-color,transform,box-shadow] duration-300',
        'hover:-translate-y-1 hover:border-brand/30 hover:shadow-md hover:shadow-brand/5',
        'focus-within:-translate-y-1 focus-within:border-brand/30 focus-within:shadow-md focus-within:shadow-brand/5',
      )}
      tabIndex={0}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Inside a task
      </p>
      <h3 className="mt-2 font-heading text-2xl font-medium">Implement realtime sync</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Wire up SSE for live Kanban updates across team members. Assignees, deadlines, rich-text
        notes, and threaded comments all live on the card — not scattered across tools.
      </p>

      <SwappingPillRow before={pillsBefore} after={pillsAfter} />

      <div className="mt-6 overflow-hidden rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Latest comment</p>
        <SwappingComment
          enterDelay={280}
          before={<>&ldquo;{commentBefore}&rdquo;</>}
          after={<>&ldquo;{commentAfter}&rdquo;</>}
        />
      </div>
    </div>
  )
}
