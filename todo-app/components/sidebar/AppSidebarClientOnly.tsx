'use client'

import { useSyncExternalStore } from 'react'
import { AppSidebar } from './AppSidebar'
import type { Org, Status, Task, TaskGroup } from '@/lib/types'

export function AppSidebarClientOnly(props: {
  personalTasks: Task[]
  personalGroups: TaskGroup[]
  personalStatuses: Status[]
  orgs: Org[]
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) return null

  return <AppSidebar {...props} />
}

