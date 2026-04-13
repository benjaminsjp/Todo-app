'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { data as initialData } from '@/app/data/test-data'
import { SortableTaskCard } from './SortableTaskCard'
import { TaskCard } from './TaskCard'
import { Badge } from '@/components/ui/badge'
import { CircleDashed, CircleEllipsis, CircleCheck } from 'lucide-react'
import { type Task } from '@/app/data/test-data'

const COLUMNS = [
  { key: 'Todo',        label: 'Todo',        icon: CircleDashed,   style: 'text-muted-foreground' },
  { key: 'In Progress', label: 'In Progress', icon: CircleEllipsis, style: 'text-blue-500' },
  { key: 'Done',        label: 'Done',        icon: CircleCheck,    style: 'text-green-500' },
]

type TaskWithGroup = Task & { group?: string }

export function KanbanBoard() {
  const [tasks, setTasks] = useState<TaskWithGroup[]>(initialData.tasks)
  const [activeTask, setActiveTask] = useState<TaskWithGroup | null>(null)

  const { taskGroups } = initialData

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // hindrer drag ved vanlig klikk
    })
  )

  const getTaskGroup = (groupTitle?: string) =>
    taskGroups.find((g) => g.title === groupTitle)

  const tasksByStatus = (status: string) =>
    tasks.filter((t) => t.status === status)

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeId = active.id
    const overId = over.id

    // over er en kolonne-ID (streng)
    if (COLUMNS.some((c) => c.key === overId)) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overId as string } : t
        )
      )
    }
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return

    const overId = over.id

    // Droppet på en kolonne
    if (COLUMNS.some((c) => c.key === overId)) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, status: overId as string } : t
        )
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-10">
        {/* Task Groups */}
        <div className="flex flex-wrap gap-3">
          {taskGroups.map((group) => (
            <div
              key={group.title}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${group.border} bg-card`}
            >
              <span className={`w-2 h-2 rounded-full ${group.bg}`} />
              {group.title}
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs">
                {group.tasks.length}
              </Badge>
            </div>
          ))}
          <div className="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium border-dashed ">
            <Badge variant="secondary" className="rounded-full p-0 size-4">
              +
            </Badge>
            Add group
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.key)
            const Icon = col.icon

            return (
              <KanbanColumn
                key={col.key}
                col={col}
                tasks={colTasks}
                getTaskGroup={getTaskGroup}
                Icon={Icon}
              />
            )
          })}
        </div>
      </div>

      {/* Drag overlay – kortet som "flyr" under drag */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95 shadow-xl scale-105 transition-transform">
            <TaskCard
              task={activeTask}
              taskGroup={getTaskGroup(activeTask.group)}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  col,
  tasks,
  getTaskGroup,
  Icon,
}: {
  col: (typeof COLUMNS)[number]
  tasks: TaskWithGroup[]
  getTaskGroup: (g?: string) => { title: string; bg: string; border: string } | undefined
  Icon: React.ElementType
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className={`size-4 ${col.style}`} />
        <span className="text-sm font-semibold">{col.label}</span>
        <Badge variant="secondary" className="ml-auto rounded-full px-1.5 py-0 text-xs">
          {tasks.length}
        </Badge>
      </div>

      <SortableContext
        id={col.key}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* Kolonnen er selv en droppable sone via col.key som over.id */}
        <div
          data-id={col.key}
          className="rounded-xl bg-muted/40 border border-dashed p-3 flex flex-col gap-2 min-h-32"
          id={col.key} // brukes av closestCorners for kolonne-deteksjon
        >
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No tasks</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                taskGroup={getTaskGroup(task.group)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}