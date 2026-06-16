import { DashboardWidget } from './DashboardWidget'
import { ListTodo } from 'lucide-react'
import Link from 'next/link'
import { type Status, type Task, type TaskGroup } from '@/lib/types'
import { resolveStatusIcon } from '@/lib/statusIcons'
import { getColor } from '@/lib/types'

interface TasksWidgetProps {
  tasks: Task[]
  taskGroups: TaskGroup[]
  statuses: Status[]
}

export function TasksWidget({ tasks, taskGroups, statuses }: TasksWidgetProps) {
  const statusCards = statuses.slice(0, 3).map((status) => {
    const count = tasks.filter((t) => t.statusId === status.id).length
    const { Icon, className } = resolveStatusIcon(status.icon, status.color)
    return { status, count, Icon, className }
  })

  return (
    <DashboardWidget title="Tasks" href="/tasks" icon={ListTodo} iconColor="text-blue-500">
      {statusCards.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statusCards.map(({ status, count, Icon, className }) => (
            <div key={status.id} className="rounded-xl p-3 flex flex-col gap-1 bg-muted/50">
              <Icon className={`size-4 ${className}`} />
              <span className="text-2xl font-semibold">{count}</span>
              <span className="text-xs font-medium opacity-80 truncate">{status.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">No tasks yet.</p>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground mb-1">Groups</span>
        {taskGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No groups yet.</p>
        ) : (
          taskGroups.slice(0, 4).map((group) => (
            <Link
              key={group.id}
              href="/tasks"
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getColor(group.color).bg}`} />
              <span className="text-sm flex-1 truncate">{group.title}</span>
              <span className="text-xs text-muted-foreground">{group.tasks?.length ?? 0} tasks</span>
            </Link>
          ))
        )}
      </div>
    </DashboardWidget>
  )
}
