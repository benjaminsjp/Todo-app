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
  useDroppable 
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove  } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Badge } from '@/components/ui/badge'
import { TaskCard } from './TaskCard'
import { CreateTaskGroupButton } from '../CreateTaskGroup/CreateTaskGroupButton'
import { TaskGroupPill } from './TaskGroupPill'
import { toast } from 'sonner'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { CreateStatusModal } from '../Status/CreateStatusModal'
import { Skeleton } from '../ui/skeleton'
import { EditStatusMenu } from '../Status/EditStatusMenu'

import { CircleDashed, CircleEllipsis, CircleCheck, Circle, Plus } from 'lucide-react'

import { type Task, TaskGroup, Status } from "@/lib/types"
import { updateTaskStatus, updateTaskOrder } from '@/lib/actions/tasks'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useOrgRealtime } from '@/lib/hooks/useOrgRealtime'


interface KanbanBoardProps {
  tasks:      Task[]
  taskGroups: TaskGroup[]
  statuses:   Status[]
  orgSlug?:   string
  orgId?:     number
  userId?:    string
}

export function getStatusStyle(color: string) {
  const map: Record<string, { icon: typeof CircleDashed; class: string }> = {
    gray:   { icon: CircleDashed,   class: 'text-muted-foreground' },
    blue:   { icon: CircleEllipsis, class: 'text-blue-500' },
    green:  { icon: CircleCheck,    class: 'text-green-500' },
    yellow: { icon: Circle,         class: 'text-yellow-500' },
    orange: { icon: Circle,         class: 'text-orange-500' },
    red:    { icon: Circle,         class: 'text-red-500' },
    purple: { icon: Circle,         class: 'text-purple-500' },
    pink:   { icon: Circle,         class: 'text-pink-500' },
  }
  return map[color] ?? map.gray
}

function SortableTaskCard({
  task,
  orgSlug,
  editingUsers,
  currentUserId,
}: {
  task: Task
  orgSlug?: string
  editingUsers?: { userId: string; user?: { displayName: string | null; email: string; avatarUrl: string | null } | null }[]
  currentUserId?: string
}) {
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
      <TaskCard task={task} orgSlug={orgSlug} editingUsers={editingUsers} currentUserId={currentUserId} />
    </div>
  )
}

function KanbanColumn({
  status,
  tasks,
  orgSlug,
  presenceByTaskId,
  currentUserId,
}: {
  status:   Status
  tasks:    Task[]
  orgSlug?: string
  presenceByTaskId: Map<number, { userId: string; user?: { displayName: string | null; email: string; avatarUrl: string | null } | null }[]>
  currentUserId?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.label })
  const { icon: Icon, class: iconClass } = getStatusStyle(status.color)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className={`size-4 ${iconClass}`} />
        <span className="text-sm font-semibold">{status.label}</span>
        <Badge variant="secondary" className=" rounded-full px-1.5 py-0 text-xs">
          {tasks.length}
        </Badge>
        <div className='ml-auto'>
          <EditStatusMenu status={status} />  
        </div>
      </div>

      <SortableContext id={status.label} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          id={status.label}
          className={cn(
            'rounded-xl bg-muted/40 border border-dashed p-3 flex flex-col gap-2 min-h-32 transition-colors',
            isOver && 'bg-muted/80 border-solid border-brand'
          )}
        >
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 my-auto ">No tasks</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                orgSlug={orgSlug}
                editingUsers={presenceByTaskId.get(task.id) ?? []}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard({ tasks: initialTasks, taskGroups, statuses, orgSlug, orgId, userId }: KanbanBoardProps) {
  const [tasks, setTasks]           = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isMounted, setIsMounted]   = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [liveStatuses, setLiveStatuses] = useState<Status[]>(statuses)
  const [liveTaskGroups, setLiveTaskGroups] = useState<TaskGroup[]>(taskGroups)

  const orgRealtime = useOrgRealtime(orgId)


  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const createTaskGroupQuery = useCallback(
    (group: string, value: string) => {
      const params       = new URLSearchParams(searchParams.toString())
      const currentValue = params.get(group)
      if (currentValue === value) {
        params.delete(group)
      } else {
        params.set(group, value)
      }
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => { setTasks(initialTasks) }, [initialTasks])
  useEffect(() => { setLiveStatuses(statuses) }, [statuses])
  useEffect(() => { setLiveTaskGroups(taskGroups) }, [taskGroups])
  useEffect(() => { setIsMounted(true) },     [])

  useEffect(() => {
    if (!orgId) return
    if (!orgRealtime.tasks || !orgRealtime.statuses || !orgRealtime.taskGroups) return
    if (activeTask) return // don't clobber state mid-drag

    setTasks(orgRealtime.tasks)
    setLiveStatuses(orgRealtime.statuses)
    setLiveTaskGroups(orgRealtime.taskGroups)
  }, [orgId, orgRealtime.tasks, orgRealtime.statuses, orgRealtime.taskGroups, activeTask])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const getStatusLabel = (task: Task): string => task.status?.label ?? 'Todo'

  const getGroupFilter = searchParams.get('group')
  const filteredTasks  = getGroupFilter
    ? tasks.filter((t) => String(t.groupId) === getGroupFilter)
    : tasks

  const tasksByStatus = (statusLabel: string) =>
    filteredTasks.filter((t) => (t.status?.label ?? 'Todo') === statusLabel)

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(filteredTasks.find((t) => t.id === active.id) ?? null)
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return

    let newStatusKey = liveStatuses.find((s) => s.label === over.id)?.label

    if (!newStatusKey) {
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) newStatusKey = getStatusLabel(overTask)
    }

    if (!newStatusKey) return

    const task = tasks.find((t) => t.id === active.id)
    if (!task) return

    const isSameColumn = task.status?.label === newStatusKey
    const isOverTask   = tasks.some((t) => t.id === over.id)

    if (isSameColumn && isOverTask) {
      // Reorder within same column
      const reordered = arrayMove(
        tasks,
        tasks.findIndex((t) => t.id === active.id),
        tasks.findIndex((t) => t.id === over.id)
      )
      setTasks(reordered)

      await updateTaskOrder(reordered.map((t) => t.id))
      return
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id !== active.id ? t : {
          ...t,
          status: { id: t.statusId ?? 0, label: newStatusKey!, color: 'gray', order: 0 },
        }
      )
    )

    const result = await updateTaskStatus(Number(active.id), newStatusKey, orgId, userId)

    if ('error' in result) {
      toast.error('Failed to update status')
      setTasks((prev) =>
        prev.map((t) => t.id !== active.id ? t : { ...t, status: task.status })
      )
    }
  }



    if (!isMounted) return (
    <div className="flex flex-col gap-10 h-full">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="w-28 h-9 rounded-full" />
      </div>
      <div className='h-full p-6 bg-card border border-border rounded-2xl animate-fade animate-once animate-duration-200  animate-ease-in-out'>
        <div className="flex flex-row gap-6">
          {liveStatuses.map((s) => (
            <div key={s.id} className="flex flex-col gap-2 min-w-80">
              <div className='flex'>
                <Skeleton className="w-24 h-7 mb-4" />
                <Skeleton className="ml-auto w-7 h-7 mb-4" />
              </div>
              <Skeleton className="min-w-72 p-3 min-h-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-10 h-full">
        <div className="flex flex-wrap gap-3 animate-fade-right animate-once animate-duration-300 animate-ease-in-out">
          {liveTaskGroups.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {liveTaskGroups.map((group) => (
                <TaskGroupPill
                  key={group.id}
                  group={group}
                  isActive={getGroupFilter === group.id.toString()}
                  filterHref={`${pathname}?${createTaskGroupQuery('group', group.id.toString())}`}
                />
              ))}
            </div>
          )}
          <CreateTaskGroupButton orgId={orgId} />
        </div>
        <ScrollArea 
          className="h-full bg-card border border-border rounded-2xl animate-fade animate-once animate-duration-200  animate-ease-in-out"
        >
          <div className="flex flex-row gap-6 items-start h-full p-6">
            {liveStatuses.map((status) => (
              <div key={status.id} className="min-w-80">
                <KanbanColumn
                  status={status}
                  tasks={tasksByStatus(status.label)}
                  orgSlug={orgSlug}
                  presenceByTaskId={orgRealtime.presenceByTaskId}
                  currentUserId={userId}
                />
              </div>
            ))}

            <div className="min-w-72 flex flex-col gap-3">
              <div className="h-8" />
              <button
                onClick={() => setStatusModalOpen(true)}
                className="rounded-xl border border-dashed p-3 min-h-32 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Plus className="size-4" /> Add status
              </button>
            </div>
          </div>
          <ScrollBar orientation='horizontal' className='mx-2 mb-2' />
        </ScrollArea>
      </div>

      <CreateStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        orgId={orgId}
      />

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