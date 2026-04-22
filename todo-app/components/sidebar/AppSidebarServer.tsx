import { auth } from '@/lib/auth/server'
import { AppSidebarClientOnly } from './AppSidebarClientOnly'
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
      <AppSidebarClientOnly
        personalTasks={personalTasks}
        personalGroups={personalGroups}
        orgs={orgs}
      />
    )
  } catch {
    return null
  }
}