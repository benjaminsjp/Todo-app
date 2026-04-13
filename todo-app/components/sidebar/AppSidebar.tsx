"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SettingsDropdown } from "@/components/sidebar/settings-dropdown"
import StatusSelect from "@/components/status-select/StatusSelect"
import { data, type Task } from "@/app/data/test-data" 
import { useState } from "react"
import { AddNewTask } from "./AddNewTask"
import { ChevronRight, Group, SeparatorVertical, Kanban, Folder, FolderOpen } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])

  const [tasks, setTasks] = useState<Task[]>(data.tasks)

  const [taskgroup, setTaskGroup] = useState<Task[]>(data.taskGroups[0].tasks)

  const { setOpen } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <a href={item.url}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.title,
                          hidden: false,
                        }}
                        onClick={() => {
                          setActiveItem(item)
                          const task = data.tasks.sort(() => Math.random() - 0.5)
                          setTasks(
                            task.slice(
                              0,
                              Math.max(5, Math.floor(Math.random() * 10) + 1)
                            )
                          )
                          setOpen(true)
                        }}
                        isActive={activeItem?.title === item.title}
                        className="p-2.5 md:p-2 h-8"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </a>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar> */}

      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 p-4 border-b">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium">
              {activeItem?.title}
            </div>
            <div className="flex items-center gap-2">
              <AddNewTask />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="border-border gap-0">
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {tasks.map((task) => (
                <a
                  href={`/tasks/${task.slug}`}
                  key={task.id}
                  className={`flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
                >
                  <div className="flex w-full items-center gap-2">
                    <StatusSelect
                      value={task.status}
                      onChange={(newStatus) =>
                        setTasks(prev =>
                          prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
                        )
                      }
                    />
                    <span className="ml-auto text-s text-muted-foreground">Due: <span className="text-foreground">{task.deadline}</span></span>
                  </div>
                  <span className="font-medium text-lg">{task.title}</span>
                  <span className="line-clamp-2 w-65 text-xs whitespace-break-spaces">
                    {task.description}
                  </span>
                </a>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="my-0 mx-0" />
          <Collapsible className="group/collapsible">
            <SidebarGroup className={`p-0 border-l-2 ${data.taskGroups[0].border}`}>
              <SidebarGroupLabel
                asChild
                className={`group/label w-full text-sm rounded-none  text-secondary-foreground bg-secondary`}
              >
                <CollapsibleTrigger>
                  <FolderOpen className="mr-2 hidden group-data-[state=open]/collapsible:block" />
                  <Folder className="mr-2 group-data-[state=open]/collapsible:hidden" />
                  {data.taskGroups[0].title}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                    <SidebarMenu>
                      {taskgroup.map((task) => (
                        <a
                          href={`/tasks/${task.slug}`}
                          key={task.id}
                          className={`flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
                        >
                          <div className="flex w-full items-center gap-2">
                            <StatusSelect
                              value={task.status}
                              onChange={(newStatus) =>
                                setTasks(prev =>
                                  prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
                                )
                              }
                            />
                            <span className="ml-auto text-s text-muted-foreground">Due: <span className="text-foreground">{task.deadline}</span></span>
                          </div>
                          <span className="font-medium text-lg">{task.title}</span>
                          <span className="line-clamp-2 w-65 text-xs whitespace-break-spaces">
                            {task.description}
                          </span>
                        </a>
                      ))}
                    </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
          <SidebarSeparator className="my-0 mx-0" />
          <Collapsible className="group/collapsible">
            <SidebarGroup className={`p-0 border-l-2 ${data.taskGroups[1].border}`}>
              <SidebarGroupLabel
                asChild
                className={`group/label w-full text-sm rounded-none text-secondary-foreground bg-secondary`}
              >
                <CollapsibleTrigger>
                  <FolderOpen className="mr-2 hidden group-data-[state=open]/collapsible:block" />
                  <Folder className="mr-2 group-data-[state=open]/collapsible:hidden" />
                  {data.taskGroups[1].title}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                    <SidebarMenu>
                      {taskgroup.map((task) => (
                        <a
                          href={`/tasks/${task.slug}`}
                          key={task.id}
                          className={`flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
                        >
                          <div className="flex w-full items-center gap-2">
                            <StatusSelect
                              value={task.status}
                              onChange={(newStatus) =>
                                setTasks(prev =>
                                  prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
                                )
                              }
                            />
                            <span className="ml-auto text-s text-muted-foreground">Due: <span className="text-foreground">{task.deadline}</span></span>
                          </div>
                          <span className="font-medium text-lg">{task.title}</span>
                          <span className="line-clamp-2 w-65 text-xs whitespace-break-spaces">
                            {task.description}
                          </span>
                        </a>
                      ))}
                    </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
          <SidebarSeparator className="my-0 mx-0" />
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
