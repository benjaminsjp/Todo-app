import { headers } from 'next/headers'

import { getCurrentUserProfile } from '@/lib/user'
import { AppSidebarClientOnly } from './AppSidebarClientOnly'
import { AppSidebarPlaceholder } from './AppSidebarPlaceholder'
import {
  getPersonalTasksForSidebar,
  getPersonalGroupsForSidebar,
  getOrgListForUser,
  getOrgNavData,
  getStatusesForUser,
  getPersonalAssigneeOptions,
  getOrgAssigneeOptions,
} from '@/lib/db/queries'

export async function AppSidebarServer() {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile) return <AppSidebarPlaceholder />

    const pathname = (await headers()).get('x-pathname') ?? ''
    const orgSlugMatch = pathname.match(/^\/org\/([^/]+)/)

    const [personalTasks, personalGroups, orgList, personalStatuses, personalAssigneeOptions] = await Promise.all([
      getPersonalTasksForSidebar(profile.id),
      getPersonalGroupsForSidebar(profile.id),
      getOrgListForUser(profile.id),
      getStatusesForUser(profile.id),
      getPersonalAssigneeOptions(profile.id),
    ])

    let activeOrgNav: Awaited<ReturnType<typeof getOrgNavData>> | null = null
    let activeOrgId: number | undefined

    const orgAssigneeOptionsEntries = await Promise.all(
      orgList.map(async (org) => [org.id, await getOrgAssigneeOptions(org.id)] as const),
    )
    const orgAssigneeOptionsByOrgId = Object.fromEntries(orgAssigneeOptionsEntries)

    if (orgSlugMatch) {
      const activeOrg = orgList.find((o) => o.slug === orgSlugMatch[1])
      if (activeOrg) {
        activeOrgId = activeOrg.id
        activeOrgNav = await getOrgNavData(activeOrg.id)
      }
    }

    const orgs = orgList.map((org) =>
      activeOrgId === org.id && activeOrgNav
        ? {
            id:       org.id,
            name:     org.name,
            slug:     org.slug,
            role:     org.role,
            tasks:    activeOrgNav.tasks,
            groups:   activeOrgNav.groups,
            statuses: activeOrgNav.statuses,
          }
        : { id: org.id, name: org.name, slug: org.slug, role: org.role },
    )

    return (
      <AppSidebarClientOnly
        personalTasks={personalTasks}
        personalGroups={personalGroups}
        personalStatuses={personalStatuses}
        personalAssigneeOptions={personalAssigneeOptions}
        orgAssigneeOptionsByOrgId={orgAssigneeOptionsByOrgId}
        orgs={orgs}
      />
    )
  } catch {
    return <AppSidebarPlaceholder />
  }
}
