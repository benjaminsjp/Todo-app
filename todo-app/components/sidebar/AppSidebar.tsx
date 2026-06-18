"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'

import {
  Sidebar, SidebarContent, SidebarHeader, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarMenuSub,
} from "@/components/ui/sidebar"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { OrgSwitcher } from "@/components/sidebar/AppSidebarOrgSwitcher"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { CreateTaskButton } from "@/components/CreateTask/CreateTaskButton"
import { CreateTaskGroupButton } from "@/components/CreateTaskGroup/CreateTaskGroupButton"
import { ChevronRight, Folder, FolderOpen, Plus, FolderPlus, GripVertical } from "lucide-react"
import { getColor, Task, TaskGroup, Org, Status } from "@/lib/types"
import { updateTaskGroup } from "@/lib/actions/tasks"
import { cn } from "@/lib/utils"
import { useDemoBanner } from "@/components/DemoBannerShell"
import { useOrgRealtime } from "@/lib/hooks/useOrgRealtime"
import { TaskOptionsMenu } from "@/components/Kanban/TaskOptionsMenu"

interface AppSidebarProps {
  personalTasks:      Task[]
  personalGroups:     TaskGroup[]
  personalStatuses:   Status[]
  orgs:               Org[]
}

function mergeTaskPatch(task: Task, patch: Partial<Task>): Task {
  return {
    ...task,
    ...patch,
    status: patch.status !== undefined ? patch.status : task.status,
    group:  patch.group  !== undefined ? patch.group  : task.group,
  }
}

function TaskItem({
  task,
  href,
  statuses,
  taskGroups,
  onOptimisticPatch,
  onOptimisticRollback,
  onDeleted,
}: {
  task: Task
  href: string
  statuses: Status[]
  taskGroups: TaskGroup[]
  onOptimisticPatch: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback: (taskId: number, prev: Task) => void
  onDeleted: (taskId: number) => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `task-${task.id}`,
    data: { taskId: task.id, groupId: task.groupId },
  })

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 50,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex items-center gap-0.5', isDragging && 'opacity-40')}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab active:cursor-grabbing rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dra oppgave"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <Link
        href={href}
        className={cn(
          'flex flex-1 min-w-0 items-center gap-2 rounded-xl px-2 py-3 text-sm transition-colors',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
        )}
      >
        <span className="font-medium truncate">{task.title}</span>
        {task.deadline && (
          <span className="ml-auto text-xs text-muted-foreground shrink-0">
            {task.deadline}
          </span>
        )}
      </Link>
      {statuses.length > 0 && (
        <TaskOptionsMenu
          task={task}
          statuses={statuses}
          taskGroups={taskGroups}
          onOptimisticPatch={onOptimisticPatch}
          onOptimisticRollback={onOptimisticRollback}
          onDeleted={() => onDeleted(task.id)}
        />
      )}
    </div>
  )
}

function GroupCollapsible({
  group,
  baseUrl,
  isOver,
  statuses,
  taskGroups,
  onOptimisticPatch,
  onOptimisticRollback,
  onDeleted,
}: {
  group:   TaskGroup
  baseUrl: string
  isOver:  boolean
  statuses: Status[]
  taskGroups: TaskGroup[]
  onOptimisticPatch: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback: (taskId: number, prev: Task) => void
  onDeleted: (taskId: number) => void
}) {
  const { setNodeRef } = useDroppable({
    id:   `group-${group.id}`,
    data: { groupId: group.id },
  })

  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup
        ref={setNodeRef}
        className={cn(
          'py-0 px-2 border-l-2 transition-colors',
          getColor(group.color).border,
          isOver && 'bg-sidebar-accent/50'
        )}
      >
        <SidebarGroupLabel
          asChild
          className={cn(
            'w-full text-sm cursor-pointer py-4 px-3 h-auto transition-colors',
            'hover:bg-sidebar-accent group-data-[state=open]/collapsible:bg-sidebar-accent',
            'group-data-[state=open]/collapsible:text-sidebar-accent-foreground',
            isOver && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
        >
          <CollapsibleTrigger>
            <FolderOpen className={cn('mr-2 size-4 hidden group-data-[state=open]/collapsible:block', getColor(group.color).text)} />
            <Folder     className={cn("mr-2 size-4 group-data-[state=open]/collapsible:hidden", isOver && getColor(group.color).text)} />
            <span className="truncate">{group.title}</span>
            <span className="ml-auto text-xs text-muted-foreground mr-2">
              {group.tasks?.length}
            </span>
            <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenuSub className="my-2">
            <SidebarGroupContent>
              {group.tasks?.length === 0 ? (
                <p className={cn(
                  'text-xs px-4 py-3 rounded-lg transition-colors',
                  isOver ? 'text-foreground bg-sidebar-accent' : 'text-muted-foreground'
                )}>
                  {isOver ? 'Slipp her' : 'Ingen oppgaver'}
                </p>
              ) : (
                group.tasks?.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    href={`${baseUrl}/${task.slug}`}
                    statuses={statuses}
                    taskGroups={taskGroups}
                    onOptimisticPatch={onOptimisticPatch}
                    onOptimisticRollback={onOptimisticRollback}
                    onDeleted={onDeleted}
                  />
                ))
              )}
            </SidebarGroupContent>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function UngroupedZone({
  tasks,
  baseUrl,
  isOver,
  statuses,
  taskGroups,
  onOptimisticPatch,
  onOptimisticRollback,
  onDeleted,
}: {
  tasks:   Task[]
  baseUrl: string
  isOver:  boolean
  statuses: Status[]
  taskGroups: TaskGroup[]
  onOptimisticPatch: (taskId: number, patch: Partial<Task>) => void
  onOptimisticRollback: (taskId: number, prev: Task) => void
  onDeleted: (taskId: number) => void
}) {
  const { setNodeRef } = useDroppable({
    id:   'ungrouped',
    data: { groupId: null },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl transition-colors mx-2',
        isOver && 'bg-sidebar-accent/50 ring-1 ring-dashed ring-border'
      )}
    >
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          href={`${baseUrl}/${task.slug}`}
          statuses={statuses}
          taskGroups={taskGroups}
          onOptimisticPatch={onOptimisticPatch}
          onOptimisticRollback={onOptimisticRollback}
          onDeleted={onDeleted}
        />
      ))}
      {isOver && tasks.length === 0 && (
        <p className="text-xs text-foreground bg-sidebar-accent px-4 py-3 rounded-lg">
          Slipp her for å fjerne fra gruppe
        </p>
      )}
    </div>
  )
}

function SidebarDndContent({
  ungroupedTasks,
  groups,
  baseUrl,
  orgId,
  statuses,
}: {
  ungroupedTasks: Task[]
  groups:         TaskGroup[]
  baseUrl:        string
  orgId?:         number
  statuses:       Status[]
}) {
  const [localTasks,  setLocalTasks]  = useState(ungroupedTasks)
  const [localGroups, setLocalGroups] = useState(groups)
  const [activeTask,  setActiveTask]  = useState<Task | null>(null)
  const [overId,      setOverId]      = useState<string | null>(null)

  useEffect(() => { setLocalTasks(ungroupedTasks) }, [ungroupedTasks])
  useEffect(() => { setLocalGroups(groups) }, [groups])

  const taskGroupsForMenu = localGroups.map(({ id, title, color, orgId, createdBy, createdAt }) => ({
    id, title, color, orgId, createdBy, createdAt,
  }))

  const findTaskById = (taskId: number): Task | undefined =>
    localTasks.find((t) => t.id === taskId) ??
    localGroups.flatMap((g) => g.tasks ?? []).find((t) => t.id === taskId)

  const handleOptimisticPatch = (taskId: number, patch: Partial<Task>) => {
    const existing = findTaskById(taskId)
    if (!existing) return

    const merged = mergeTaskPatch(existing, patch)

    if ('groupId' in patch && patch.groupId !== existing.groupId) {
      const nextGroupId = patch.groupId ?? null
      const without = (list: Task[]) => list.filter((t) => t.id !== taskId)

      setLocalTasks((prev) => {
        const rest = without(prev)
        return nextGroupId === null ? [...rest, merged] : rest
      })

      setLocalGroups((prev) =>
        prev.map((g) => {
          const tasksInGroup = without(g.tasks ?? [])
          if (g.id === nextGroupId) {
            return { ...g, tasks: [...tasksInGroup, merged] }
          }
          return { ...g, tasks: tasksInGroup }
        })
      )
      return
    }

    const apply = (t: Task) => (t.id === taskId ? merged : t)
    setLocalTasks((prev) => prev.map(apply))
    setLocalGroups((prev) =>
      prev.map((g) => ({ ...g, tasks: g.tasks?.map(apply) }))
    )
  }

  const handleOptimisticRollback = (taskId: number, prev: Task) => {
    handleOptimisticPatch(taskId, {
      status: prev.status,
      statusId: prev.statusId,
      group: prev.group,
      groupId: prev.groupId,
      deadline: prev.deadline,
    })
  }

  const handleTaskDeleted = (taskId: number) => {
    setLocalTasks((prev) => prev.filter((t) => t.id !== taskId))
    setLocalGroups((prev) =>
      prev.map((g) => ({ ...g, tasks: g.tasks?.filter((t) => t.id !== taskId) }))
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const taskId = active.data.current?.taskId as number
    const task =
      localTasks.find((t) => t.id === taskId) ??
      localGroups.flatMap((g) => g.tasks ?? []).find((t) => t.id === taskId) ??
      null
    setActiveTask(task)
  }

  const handleDragOver = ({ over }: { over: any }) => {
    setOverId(over?.id ?? null)
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    setOverId(null)
    if (!over) return

    const taskId      = active.data.current?.taskId    as number
    const fromGroupId = active.data.current?.groupId   as number | null
    const toGroupId   = over.data.current?.groupId     as number | null | undefined

    if (fromGroupId === toGroupId) return
    if (toGroupId === undefined)   return

    setLocalTasks((prev) => {
      if (toGroupId === null) {
        const task = localGroups.flatMap((g) => g.tasks ?? []).find((t) => t.id === taskId)
        if (task) return [...prev, { ...task, groupId: null, group: null }]
        return prev
      }
      return prev.filter((t) => t.id !== taskId)
    })

    setLocalGroups((prev) =>
      prev.map((g) => {
        if (g.id === fromGroupId) {
          return { ...g, tasks: (g.tasks ?? []).filter((t) => t.id !== taskId) }
        }
        if (g.id === toGroupId) {
          const task =
            localTasks.find((t) => t.id === taskId) ??
            prev.flatMap((g) => g.tasks ?? []).find((t) => t.id === taskId)
          if (task) return { ...g, tasks: [...(g.tasks ?? []), { ...task, groupId: toGroupId }] }
        }
        return g
      })
    )

    const result = await updateTaskGroup(taskId, toGroupId)
    if ('error' in result) {
      toast.error('Kunne ikke flytte oppgaven')
      setLocalTasks(ungroupedTasks)
      setLocalGroups(groups)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <UngroupedZone
        tasks={localTasks}
        baseUrl={baseUrl}
        isOver={overId === 'ungrouped'}
        statuses={statuses}
        taskGroups={taskGroupsForMenu}
        onOptimisticPatch={handleOptimisticPatch}
        onOptimisticRollback={handleOptimisticRollback}
        onDeleted={handleTaskDeleted}
      />

      {localGroups.map((group) => (
        <GroupCollapsible
          key={group.id}
          group={group}
          baseUrl={baseUrl}
          isOver={overId === `group-${group.id}`}
          statuses={statuses}
          taskGroups={taskGroupsForMenu}
          onOptimisticPatch={handleOptimisticPatch}
          onOptimisticRollback={handleOptimisticRollback}
          onDeleted={handleTaskDeleted}
        />
      ))}

      {localGroups.length === 0 && localTasks.length === 0 && (
        <p className="text-xs text-muted-foreground px-4 py-3">Ingen oppgaver</p>
      )}

      <DragOverlay>
        {activeTask && (
          <div className="rounded-xl px-4 py-3 text-sm bg-sidebar-accent shadow-lg border border-border opacity-95 flex items-center gap-2">
            <span className="font-medium truncate">{activeTask.title}</span>
            {activeTask.deadline && (
              <span className="ml-auto text-xs text-muted-foreground shrink-0">
                {activeTask.deadline}
              </span>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export function AppSidebar({ personalTasks, personalGroups, personalStatuses, orgs }: AppSidebarProps) {
  const pathname       = usePathname()
  const { visible: demoBannerVisible } = useDemoBanner()
  const currentOrgSlug = pathname.startsWith('/org/') ? pathname.split('/')[2] : undefined
  const activeOrg      = orgs.find((o) => o.slug === currentOrgSlug) ?? null
  const orgRealtime    = useOrgRealtime(activeOrg?.id)

  const ungroupedPersonal = personalTasks.filter((t) => !t.group)

  const baseUrl      = activeOrg ? `/org/${activeOrg.slug}` : '/tasks'
  const liveOrgTasks  = (activeOrg && orgRealtime.tasks) ? orgRealtime.tasks : activeOrg?.tasks
  const liveOrgGroups = (activeOrg && orgRealtime.taskGroups) ? orgRealtime.taskGroups : activeOrg?.groups
  const liveOrgStatuses = (activeOrg && orgRealtime.statuses) ? orgRealtime.statuses : activeOrg?.statuses
  const ungrouped    = activeOrg ? (liveOrgTasks ?? []).filter((t) => !t.group) : ungroupedPersonal
  const groups       = activeOrg ? (liveOrgGroups ?? []) : personalGroups
  const statuses     = activeOrg ? (liveOrgStatuses ?? []) : personalStatuses

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        'overflow-hidden *:data-[sidebar=sidebar]:flex-row',
        demoBannerVisible && '!top-(--demo-banner-height) !bottom-auto !h-[calc(100svh-var(--demo-banner-height))]',
      )}
    >
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-1 p-4 border-b flex flex-row items-center">
          <OrgSwitcher orgs={orgs} />
          <CreateTaskButton orgId={activeOrg?.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="sm"><Plus />Ny oppgave</Button>
              </TooltipTrigger>
              <TooltipContent><p>Opprett en ny oppgave</p></TooltipContent>
            </Tooltip>
          </CreateTaskButton>
          <CreateTaskGroupButton orgId={activeOrg?.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="icon-sm"><FolderPlus /></Button>
              </TooltipTrigger>
              <TooltipContent><p>Opprett en ny gruppe</p></TooltipContent>
            </Tooltip>
          </CreateTaskGroupButton>
        </SidebarHeader>

        <SidebarContent className="pt-3 gap-0">
          <SidebarDndContent
            key={activeOrg?.id ?? 'personal'}
            ungroupedTasks={ungrouped}
            groups={groups}
            baseUrl={baseUrl}
            orgId={activeOrg?.id}
            statuses={statuses}
          />
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}