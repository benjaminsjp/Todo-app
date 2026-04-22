import Link from 'next/link'
import { CalendarDays, MessageCircle, Pencil } from 'lucide-react'
import { type Task } from "@/lib/types"

type EditingUser = {
  userId: string
  user?: { displayName: string | null; email: string; avatarUrl: string | null } | null
}

interface TaskCardProps {
  task: Task
  orgSlug?: string
  editingUsers?: EditingUser[]
  currentUserId?: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function TaskCard({ task, orgSlug, editingUsers = [], currentUserId }: TaskCardProps) {
  const groupColor = task.group?.color ?? null
  const href = orgSlug ? `/org/${orgSlug}/${task.slug}` : `/tasks/${task.slug}`

  const othersEditing = editingUsers.filter((u) => u.userId !== currentUserId)
  

  return (
    <Link href={href}>
      <div className="group rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md hover:border-foreground/20 transition-all duration-200 cursor-pointer">
        <div className="flex items-center gap-2">
          {task.group && groupColor ? (
            <>
              <span className={`inline-block w-2 h-2 rounded-full ${groupColor}`} />
              <span className="text-xs text-muted-foreground">{task.group.title}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground"> </span>
          )}
          {othersEditing.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-medium">
              <Pencil className="size-3" /> Editing{othersEditing.length > 1 ? ` (${othersEditing.length})` : ''}
            </span>
          )}
        </div>
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