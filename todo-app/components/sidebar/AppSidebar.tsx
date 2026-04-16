// components/sidebar/AppSidebar.tsx
"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarSeparator,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenuSub,
} from "@/components/ui/sidebar"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { OrgSwitcher } from "@/components/sidebar/AppSidebarOrgSwitcher"
import {
  ChevronRight, Folder, FolderOpen, CircleDashed,
  CircleEllipsis, CircleCheck, Plus, FolderPlus
} from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { CreateTaskButton } from "@/components/CreateTask/CreateTaskButton"
import { CreateTaskGroupButton } from "@/components/CreateTaskGroup/CreateTaskGroupButton"


import { getColor, Task, Status, TaskGroup, Org } from "@/lib/types"


interface AppSidebarProps {
  personalTasks:  Task[]
  personalGroups: TaskGroup[]
  orgs:           Org[]
}

function StatusIcon({ label }: { label?: string | null }) {
  if (label === 'Done')        return <CircleCheck    className="size-3 text-green-500 shrink-0" />
  if (label === 'In Progress') return <CircleEllipsis className="size-3 text-blue-500 shrink-0" />
  return                              <CircleDashed   className="size-3 text-muted-foreground shrink-0" />
}

function TaskItem({ task, href }: { task: Task; href: string }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex flex-col gap-1 rounded-xl px-4 py-3 text-sm last:border-b-0
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors
        ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
    >
      <div className="flex items-center gap-2">
        <StatusIcon label={task.status?.label} />
        <span className="font-medium truncate">{task.title}</span>
        {task.deadline && (
          <span className="ml-auto text-xs text-muted-foreground shrink-0">
            {task.deadline}
          </span>
        )}
      </div>
    </Link>
  )
}

function GroupCollapsible({ group, baseUrl }: { group: TaskGroup; baseUrl: string }) {
  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup className={`py-0 px-2 border-l-2 ${getColor(group.color).border}`}>
        <SidebarGroupLabel
          asChild
          className="w-full text-sm cursor-pointer py-4 px-3 h-auto hover:bg-accent group-data-[state=open]/collapsible:bg-accent group-data-[state=open]/collapsible:text-accent-foreground"
        >
          <CollapsibleTrigger>
            <FolderOpen className={`mr-2 size-4 hidden group-data-[state=open]/collapsible:block ${getColor(group.color).text}`} />
            <Folder     className={`mr-2 size-4 group-data-[state=open]/collapsible:hidden`} />
            <span className="truncate">{group.title}</span>
            <span className="ml-auto text-xs text-muted-foreground mr-2">
              {group.tasks?.length}
            </span>
            <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenuSub className="my-2">
            <SidebarGroupContent >
              {group.tasks?.length === 0 ? (
                <p className="text-xs text-muted-foreground px-4 py-3">Ingen tasks</p>
              ) : (
                group.tasks?.map((task) => (
                  <TaskItem key={task.id} task={task} href={`${baseUrl}/${task.slug}`} />
                ))
              )}
            </SidebarGroupContent>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AppSidebar({ personalTasks, personalGroups, orgs }: AppSidebarProps) {
  const pathname = usePathname()
  const currentOrgSlug = pathname.startsWith('/org/')
    ? pathname.split('/')[2]
    : undefined

  const activeOrg = orgs.find((o) => o.slug === currentOrgSlug) ?? null
  const ungroupedPersonal = personalTasks.filter((t) => !t.group)

  return (
     <Sidebar collapsible="icon" className="overflow-hidden *:data-[sidebar=sidebar]:flex-row">
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-1 p-4 border-b flex flex-row items-center">
          <OrgSwitcher orgs={orgs} />
          <CreateTaskButton orgId={activeOrg?.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="brand" size="sm">
                  <Plus />New task
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Create a new task</p></TooltipContent>
            </Tooltip>
          </CreateTaskButton>
          <CreateTaskGroupButton orgId={activeOrg?.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="brand" size="icon-sm">
                  <FolderPlus />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Create a new group</p></TooltipContent>
            </Tooltip>
          </CreateTaskGroupButton>
        </SidebarHeader>

        <SidebarContent className="pt-3 gap-0">
          {activeOrg ? (
            <>
              {activeOrg.tasks.filter((t) => !t.group).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  href={`/org/${activeOrg.slug}/${task.slug}`}
                />
              ))}
              {activeOrg.groups.map((group) => (
                <GroupCollapsible
                  key={group.id}
                  group={group}
                  baseUrl={`/org/${activeOrg.slug}`}
                />
              ))}
              {activeOrg.tasks.length === 0 && (
                <p className="text-xs text-muted-foreground px-4 py-3">Ingen tasks</p>
              )}
            </>
          ) : (
            <>
              {ungroupedPersonal.map((task) => (
                <TaskItem key={task.id} task={task} href={`/tasks/${task.slug}`} />
              ))}
              {personalGroups.map((group) => (
                <GroupCollapsible key={group.id} group={group} baseUrl="/tasks" />
              ))}
              {personalTasks.length === 0 && (
                <p className="text-xs text-muted-foreground px-4 py-3">Ingen tasks</p>
              )}
            </>
          )}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}