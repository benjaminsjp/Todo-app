import { getCurrentUserProfile } from '@/lib/user'
import { AppSidebarClientOnly } from './AppSidebarClientOnly'
import { AppSidebarPlaceholder } from './AppSidebarPlaceholder'
import {
  getPersonalTasksForSidebar,
  getPersonalGroupsForSidebar,
  getOrgListForUser,
  getStatusesForUser,
  getPersonalAssigneeOptions,
} from '@/lib/db/queries'

/**
 * Stable sidebar payload for the shared app layout.
 * Avoids headers()/pathname so this segment is not re-fetched on every navigation.
 * Active org task lists stream in via useOrgRealtime on the client.
 */
export async function AppSidebarServer() {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile) return <AppSidebarPlaceholder />

    const [personalTasks, personalGroups, orgList, personalStatuses, personalAssigneeOptions] =
      await Promise.all([
        getPersonalTasksForSidebar(profile.id),
        getPersonalGroupsForSidebar(profile.id),
        getOrgListForUser(profile.id),
        getStatusesForUser(profile.id),
        getPersonalAssigneeOptions(profile.id),
      ])

    const orgs = orgList.map((org) => ({
      id:   org.id,
      name: org.name,
      slug: org.slug,
      role: org.role,
    }))

    return (
      <AppSidebarClientOnly
        personalTasks={personalTasks}
        personalGroups={personalGroups}
        personalStatuses={personalStatuses}
        personalAssigneeOptions={personalAssigneeOptions}
        orgAssigneeOptionsByOrgId={{}}
        orgs={orgs}
      />
    )
  } catch {
    return <AppSidebarPlaceholder />
  }
}
