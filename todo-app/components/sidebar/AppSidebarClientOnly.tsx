'use client'

import { useSyncExternalStore } from 'react'
import { AppSidebar } from './AppSidebar'
import { AppSidebarPlaceholder } from './AppSidebarPlaceholder'
import type { AssigneeOption, Org, Status, Task, TaskGroup } from '@/lib/types'

export function AppSidebarClientOnly(props: {
  personalTasks: Task[]
  personalGroups: TaskGroup[]
  personalStatuses: Status[]
  personalAssigneeOptions: AssigneeOption[]
  orgAssigneeOptionsByOrgId: Record<number, AssigneeOption[]>
  orgs: Org[]
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // DndContext must not SSR — aria-describedby IDs differ between server and client.
  if (!mounted) return <AppSidebarPlaceholder />

  return <AppSidebar {...props} />
}
