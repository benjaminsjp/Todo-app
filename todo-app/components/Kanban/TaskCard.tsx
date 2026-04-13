import Link from 'next/link'
import { CalendarDays, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type Task } from '@/app/data/test-data'

type TaskGroup = {
  title: string
  bg: string
  border: string
}

interface TaskCardProps {
  task: Task & { group?: string }
  taskGroup?: TaskGroup
}

export function TaskCard({ task, taskGroup }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.slug}`}>
      <div className="group rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md hover:border-foreground/20 transition-all duration-200 cursor-pointer">
        {taskGroup && (
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${taskGroup.bg}`} />
            <span className="text-xs text-muted-foreground">{taskGroup.title}</span>
          </div>
        )}
        <p className="text-sm font-medium leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
          {task.title}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3" />
            {task.deadline}
          </div>
          {task.comments?.length ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="size-3" />
              {task.comments.length}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}