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
import { Button } from '@/components/ui/button'
import { TaskCard } from './TaskCard'
import { KanbanOverlayLockProvider, useKanbanOverlayLocked } from './KanbanOverlayLock'
import { CreateTaskGroupButton } from '../CreateTaskGroup/CreateTaskGroupButton'
import { TaskGroupPill } from './TaskGroupPill'
import { toast } from 'sonner'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { CreateStatusModal } from '../Status/CreateStatusModal'
import { Skeleton } from '../ui/skeleton'
import { EditStatusMenu } from '../Status/EditStatusMenu'

import { Circle, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { resolveStatusIcon } from '@/lib/statusIcons'

import { type Task, TaskGroup, Status, AssigneeOption } from "@/lib/types"
import { updateTaskStatus, updateTaskOrder } from '@/lib/actions/tasks'
import { reorderStatuses } from '@/lib/actions/statuses'

import { DEFAULT_STATUS_LABELS } from '@/lib/statusDefaults'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useOrgRealtime, type TaskPresence } from '@/lib/hooks/useOrgRealtime'

interface KanbanBoardProps {
  tasks:           Task[]
  taskGroups:      TaskGroup[]
  statuses:        Status[]
  assigneeOptions: AssigneeOption[]
  orgSlug?:        string
  orgId?:          number
  userId?:         string
}

export function getStatusStyle(color: string, icon?: string | null) {
  const { Icon, className } = resolveStatusIcon(icon, color)
  return { icon: Icon, class: className }
}

function SortableTaskCard({
  task,
  orgSlug,
  presenceUsers,
  currentUserId,
  statuses,
  taskGroups,
  assigneeOptions,
  onOptimisticPatch,
  onOptimisticRollback,
}: {
  task: Task
  orgSlug?: string
  presenceUsers?: TaskPresence[]
  currentUserId?: string
  statuses: Status[]
  taskGroups: TaskGroup[]
  assigneeOptions: AssigneeOption[]
  onOptimisticPatch: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback: (taskId: number, prev: Task) => void
}) {
  const overlayLocked = useKanbanOverlayLocked()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: overlayLocked,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...(overlayLocked ? {} : listeners)}
      className={isDragging ? 'opacity-40' : ''}
    >
      <TaskCard
        task={task}
        orgSlug={orgSlug}
        presenceUsers={presenceUsers}
        currentUserId={currentUserId}
        statuses={statuses}
        taskGroups={taskGroups}
        assigneeOptions={assigneeOptions}
        onOptimisticPatch={onOptimisticPatch}
        onOptimisticRollback={onOptimisticRollback}
      />
    </div>
  )
}

function KanbanColumn({
  status,
  statusIndex,
  statusCount,
  tasks,
  orgSlug,
  presenceByTaskId,
  currentUserId,
  statuses,
  taskGroups,
  assigneeOptions,
  onOptimisticPatch,
  onOptimisticRollback,
  onMoveStatus,
}: {
  status: Status
  statusIndex: number
  statusCount: number
  tasks: Task[]
  orgSlug?: string
  presenceByTaskId: Map<number, TaskPresence[]>
  currentUserId?: string
  statuses: Status[]
  taskGroups: TaskGroup[]
  assigneeOptions: AssigneeOption[]
  onOptimisticPatch: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback: (taskId: number, prev: Task) => void
  onMoveStatus: (statusId: number, direction: 'left' | 'right') => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.label })
  const { icon: Icon, class: iconClass } = getStatusStyle(status.color, status.icon)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className={`size-4 ${iconClass}`} />
        <span className="text-sm font-semibold">{status.label}</span>
        <Badge variant="secondary" className=" rounded-full px-1.5 py-0 text-xs">
          {tasks.length}
        </Badge>
        <div className='ml-auto flex items-center gap-0.5'>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={statusIndex === 0}
            onClick={() => onMoveStatus(status.id, 'left')}
            aria-label="Flytt status til venstre"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={statusIndex >= statusCount - 1}
            onClick={() => onMoveStatus(status.id, 'right')}
            aria-label="Flytt status til høyre"
          >
            <ChevronRight className="size-3.5" />
          </Button>
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
            <p className="text-xs text-muted-foreground text-center py-6 my-auto ">Ingen oppgaver</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                orgSlug={orgSlug}
                presenceUsers={presenceByTaskId.get(task.id) ?? []}
                currentUserId={currentUserId}
                statuses={statuses}
                taskGroups={taskGroups}
                assigneeOptions={assigneeOptions}
                onOptimisticPatch={onOptimisticPatch}
                onOptimisticRollback={onOptimisticRollback}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard(props: KanbanBoardProps) {
  return (
    <KanbanOverlayLockProvider>
      <KanbanBoardContent {...props} />
    </KanbanOverlayLockProvider>
  )
}

function KanbanBoardContent({
  tasks: initialTasks,
  taskGroups,
  statuses,
  assigneeOptions,
  orgSlug,
  orgId,
  userId,
}: KanbanBoardProps) {
  const [tasks, setTasks]           = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isMounted, setIsMounted]   = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [liveStatuses, setLiveStatuses]       = useState<Status[]>(statuses)
  const [liveTaskGroups, setLiveTaskGroups]   = useState<TaskGroup[]>(taskGroups)

  // Sporer antall pågående optimistiske oppdateringer
  const pendingCount = useRef(0)
  const movePendingRef = useRef(false)

  const orgRealtime = useOrgRealtime(orgId)
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const createTaskGroupQuery = useCallback(
    (group: string, value: string) => {
      const params       = new URLSearchParams(searchParams.toString())
      const currentValue = params.get(group)
      if (currentValue === value) params.delete(group)
      else params.set(group, value)
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => { setTasks(initialTasks) },    [initialTasks])
  useEffect(() => { setLiveStatuses(statuses) },  [statuses])
  useEffect(() => { setLiveTaskGroups(taskGroups) }, [taskGroups])
  useEffect(() => { setIsMounted(true) },         [])

  // Realtime – ignorer hvis drag pågår eller vi har ubekreftede oppdateringer
  useEffect(() => {
    if (!orgId) return
    if (!orgRealtime.tasks || !orgRealtime.statuses || !orgRealtime.taskGroups) return
    if (activeTask) return
    if (pendingCount.current > 0) return
    if (movePendingRef.current) return

    setTasks(orgRealtime.tasks)
    setLiveStatuses(orgRealtime.statuses)
    setLiveTaskGroups(orgRealtime.taskGroups)
  }, [orgId, orgRealtime.tasks, orgRealtime.statuses, orgRealtime.taskGroups, activeTask])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const getStatusLabel = (task: Task): string => task.status?.label ?? DEFAULT_STATUS_LABELS.todo

  const getGroupFilter = searchParams.get('group')
  const filteredTasks  = getGroupFilter
    ? tasks.filter((t) => String(t.groupId) === getGroupFilter)
    : tasks

  const tasksByStatus = (status: Status, index: number) =>
    filteredTasks.filter((t) => {
      if (!t.statusId && !t.status) return index === 0
      return (t.status?.label ?? DEFAULT_STATUS_LABELS.todo) === status.label
    })

  const sortedStatuses = [...liveStatuses].sort((a, b) => a.order - b.order || a.id - b.id)

  const handleMoveStatus = async (statusId: number, direction: 'left' | 'right') => {
    if (movePendingRef.current) return

    const sorted = [...liveStatuses].sort((a, b) => a.order - b.order || a.id - b.id)
    const idx = sorted.findIndex((s) => s.id === statusId)
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(swapIdx, 0, moved)
    const withNewOrder = reordered.map((s, i) => ({ ...s, order: i }))
    const prevStatuses = liveStatuses

    movePendingRef.current = true
    setLiveStatuses(withNewOrder)

    const result = await reorderStatuses(withNewOrder.map((s) => s.id))
    movePendingRef.current = false

    if ('error' in result) {
      toast.error(result.error)
      setLiveStatuses(prevStatuses)
    }
  }

  const patchTaskOptimistic = useCallback((taskId: number, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)))
  }, [])

  const rollbackTaskOptimistic = useCallback((taskId: number, prevTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? prevTask : t)))
  }, [])

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

    // ── Reorder innen samme kolonne ──────────────────────────────────────────
    if (isSameColumn && isOverTask) {
      const prevTasks = [...tasks]
      const reordered = arrayMove(
        tasks,
        tasks.findIndex((t) => t.id === active.id),
        tasks.findIndex((t) => t.id === over.id)
      )

      pendingCount.current++
      setTasks(reordered)

      try {
        await updateTaskOrder(reordered.map((t) => t.id))
      } catch {
        toast.error('Kunne ikke endre rekkefølgen på oppgavene')
        setTasks(prevTasks)
      } finally {
        pendingCount.current--
      }
      return
    }

    // ── Flytt til ny kolonne ─────────────────────────────────────────────────
    const newStatus = liveStatuses.find((s) => s.label === newStatusKey)
    if (!newStatus) return

    const prevTasks = [...tasks]

    pendingCount.current++
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== active.id ? t : { ...t, status: newStatus }
      )
    )

    try {
      const result = await updateTaskStatus(Number(active.id), newStatusKey, orgId, userId)
      if ('error' in result) {
        toast.error('Kunne ikke oppdatere status')
        setTasks(prevTasks)
      }
    } catch {
      toast.error('Kunne ikke oppdatere status')
      setTasks(prevTasks)
    } finally {
      pendingCount.current--
    }
  }

  if (!isMounted) return (
    <div className="flex flex-col gap-10 h-full">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="w-28 h-9 rounded-full" />
      </div>
      <div className="h-full p-6 bg-card border border-border rounded-2xl animate-fade animate-once animate-duration-200 animate-ease-in-out">
        <div className="flex flex-row gap-6">
          {liveStatuses.map((s) => (
            <div key={s.id} className="flex flex-col gap-2 min-w-80">
              <div className="flex">
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
          className="h-full bg-card border border-border rounded-2xl animate-fade animate-once animate-duration-200 animate-ease-in-out"
        >
          <div className="flex flex-row gap-6 items-start h-full p-6">
            {sortedStatuses.map((status, index) => (
              <div key={status.id} className="max-w-90 min-w-90">
                <KanbanColumn
                  status={status}
                  statusIndex={index}
                  statusCount={sortedStatuses.length}
                  tasks={tasksByStatus(status, index)}
                  orgSlug={orgSlug}
                  presenceByTaskId={orgRealtime.presenceByTaskId}
                  currentUserId={userId}
                  statuses={sortedStatuses}
                  taskGroups={liveTaskGroups}
                  assigneeOptions={assigneeOptions}
                  onOptimisticPatch={patchTaskOptimistic}
                  onOptimisticRollback={rollbackTaskOptimistic}
                  onMoveStatus={handleMoveStatus}
                />
              </div>
            ))}

            <div className="min-w-72 flex flex-col gap-3">
              <div className="h-8" />
              <button
                onClick={() => setStatusModalOpen(true)}
                className="rounded-xl border border-dashed p-3 min-h-32 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Plus className="size-4" /> Legg til status
              </button>
            </div>
          </div>
          <ScrollBar orientation="horizontal" className="mx-2 mb-2" />
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
            <TaskCard
              task={activeTask}
              orgSlug={orgSlug}
              statuses={liveStatuses}
              taskGroups={liveTaskGroups}
              assigneeOptions={assigneeOptions}
              onOptimisticPatch={patchTaskOptimistic}
              onOptimisticRollback={rollbackTaskOptimistic}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}