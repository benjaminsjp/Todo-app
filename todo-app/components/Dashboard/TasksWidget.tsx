import { DashboardWidget } from './DashboardWidget'
import { ListTodo, CircleDashed, CircleEllipsis, CircleCheck } from 'lucide-react'
import { data } from '@/app/data/test-data'
import Link from 'next/link'

export function TasksWidget() {
  const { tasks, taskGroups } = data

  const counts = {
    todo:       tasks.filter((t) => t.status === 'Todo').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    done:       tasks.filter((t) => t.status === 'Done').length,
  }

  const statuses = [
    { label: 'Todo',        count: counts.todo,       icon: CircleDashed,   style: 'text-muted-foreground bg-muted' },
    { label: 'In Progress', count: counts.inProgress, icon: CircleEllipsis, style: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Done',        count: counts.done,       icon: CircleCheck,    style: 'text-green-600 bg-green-50 dark:bg-green-950/40' },
  ]

  return (
    <DashboardWidget title="Tasks" href="/tasks" icon={ListTodo} iconColor="text-blue-500">
      {/* Status counts */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statuses.map(({ label, count, icon: Icon, style }) => (
          <div key={label} className={`rounded-xl p-3 flex flex-col gap-1 ${style}`}>
            <Icon className="size-4" />
            <span className="text-2xl font-semibold">{count}</span>
            <span className="text-xs font-medium opacity-80">{label}</span>
          </div>
        ))}
      </div>

      {/* Task groups */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground mb-1">Groups</span>
        {taskGroups.map((group) => (
          <Link
            key={group.title}
            href="/tasks"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${group.bg}`} />
            <span className="text-sm flex-1">{group.title}</span>
            <span className="text-xs text-muted-foreground">{group.tasks.length} tasks</span>
          </Link>
        ))}
      </div>
    </DashboardWidget>
  )
}