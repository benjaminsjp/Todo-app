'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MessageCircle, CircleDashed, CircleEllipsis, CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TaskCard } from './TaskCard'
import { type Task, TaskGroup, Status, Comment, bgToBorder } from "@/lib/types"
import { CreateTaskGroupButton } from '../CreateTaskGroup/CreateTaskGroupButton'
import { CreateOrgButton } from '../CreateOrg/CreateOrgButton'

const COLUMNS = [
  { key: 'Todo',        label: 'Todo',        icon: CircleDashed,   style: 'text-muted-foreground' },
  { key: 'In Progress', label: 'In Progress', icon: CircleEllipsis, style: 'text-blue-500' },
  { key: 'Done',        label: 'Done',        icon: CircleCheck,    style: 'text-green-500' },
]


interface KanbanBoardProps {
  tasks:      Task[]
  taskGroups: TaskGroup[]
  orgSlug?:   string
  orgId?:     number
}

// ─── Sortable Task Card ───────────────────────────────────────────────────────

function SortableTaskCard({ task, orgSlug }: { task: Task; orgSlug?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-40' : ''}
    >
      <TaskCard task={task} orgSlug={orgSlug} />
    </div>
  )
}


// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  orgSlug,
}: {
  col:     (typeof COLUMNS)[number]
  tasks:   Task[]
  orgSlug?: string
}) {
  const Icon = col.icon

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className={`size-4 ${col.style}`} />
        <span className="text-sm font-semibold">{col.label}</span>
        <Badge variant="secondary" className="ml-auto rounded-full px-1.5 py-0 text-xs">
          {tasks.length}
        </Badge>
      </div>

      <SortableContext id={col.key} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          id={col.key}
          className="rounded-xl bg-muted/40 border border-dashed p-3 flex flex-col gap-2 min-h-32"
        >
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Ingen tasks</p>
          ) : (
            tasks.map((task) => <SortableTaskCard key={task.id} task={task} orgSlug={orgSlug} />)
          )}
        </div>
      </SortableContext>
    </div>
  )
}


// ─── Kanban Board ─────────────────────────────────────────────────────────────

export function KanbanBoard({ tasks: initialTasks, taskGroups, orgSlug, orgId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => setIsMounted(true), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const getStatusLabel = (task: Task): string => {
    return task.status?.label ?? 'Todo'
  }

  const tasksByStatus = (statusKey: string) =>
    tasks.filter((t) => getStatusLabel(t) === statusKey)

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return

    const newStatusKey = COLUMNS.find((c) => c.key === over.id)?.key
    if (!newStatusKey) return

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== active.id) return t
        return {
          ...t,
          status: { id: t.statusId ?? 0, label: newStatusKey, color: 'gray' },
        }
      })
    )
  }

  if (!isMounted) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map((col) => (
        <div key={col.key} className="rounded-xl bg-muted/40 border border-dashed p-3 min-h-32" />
      ))}
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-10">
        {/* Task Groups */}
        <div className="flex flex-wrap gap-3">
          {taskGroups.length > 0 && (
            <>
              {taskGroups.map((group) => (
                <div
                  key={group.id}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${bgToBorder(group.color)} bg-card`}
                >
                  <span className={`w-2 h-2 rounded-full ${group.color}`} />
                  {group.title}
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs">
                    {group.tasks?.length ?? 0}
                  </Badge>
                </div>
              ))}
            </>
          )}
          <CreateTaskGroupButton orgId={orgId} />
          <CreateOrgButton />
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {COLUMNS.map((col) => (
            <KanbanColumn key={col.key} col={col} tasks={tasksByStatus(col.key)} orgSlug={orgSlug} />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95 shadow-xl scale-105">
            <TaskCard task={activeTask} orgSlug={orgSlug} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}