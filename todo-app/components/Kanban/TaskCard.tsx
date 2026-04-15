import Link from 'next/link'
import { CalendarDays, MessageCircle } from 'lucide-react'
import { type Task, TaskGroup, Comment } from "@/lib/types"


interface TaskCardProps {
  task: Task
  orgSlug?: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function TaskCard({ task, orgSlug }: TaskCardProps) {
  const groupColor = task.group?.color ?? null
  const href = orgSlug ? `/org/${orgSlug}/${task.slug}` : `/tasks/${task.slug}`

  

  return (
    <Link href={href}>
      <div className="group rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md hover:border-foreground/20 transition-all duration-200 cursor-pointer">
        {task.group && groupColor && (
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${groupColor}`} />
            <span className="text-xs text-muted-foreground">{task.group.title}</span>
          </div>
        )}
        <p className="text-sm font-medium leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {stripHtml(task.description)}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          {task.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              {task.deadline}
            </div>
          )}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <MessageCircle className="size-3" />
              {task.comments.length}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}