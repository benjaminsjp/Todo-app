"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { SettingsDropdown } from "@/components/sidebar/settings-dropdown"
import StatusSelect from "@/components/status-select/StatusSelect"
import { data, type Task } from "@/app/data/test-data" 
import { useState } from "react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])

  const [tasks, setTasks] = useState<Task[]>(data.tasks)

  const { setOpen } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="w-(--sidebar-width-icon)! border-r"
      >
        {/* <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader> */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="">
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
                        className={`px-2.5 md:px-2`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </a>
                  </SidebarMenuItem>
                ))}

                {/* Legger til Settings knapp i sidebar */}
                <SidebarMenuItem>
                  <SettingsDropdown />
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 p-4 border-b">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium">
              {activeItem?.title}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="border-border">
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
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
