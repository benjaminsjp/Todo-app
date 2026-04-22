import { auth } from '@/lib/auth/server'
import { AppSidebar } from './AppSidebar'
import {
  getPersonalTasksForSidebar,
  getPersonalGroupsForSidebar,
  getOrgsForSidebar,
} from '@/lib/db/queries'

export async function AppSidebarServer() {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return null

    const userId = session.user.id

    const [personalTasks, personalGroups, orgs] = await Promise.all([
      getPersonalTasksForSidebar(userId),
      getPersonalGroupsForSidebar(userId),
      getOrgsForSidebar(userId),
    ])

    return (
      <AppSidebar
        personalTasks={personalTasks}
        personalGroups={personalGroups}
        orgs={orgs}
      />
    )
  } catch {
    return null
  }
}