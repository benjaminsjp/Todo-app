import { getCurrentUserProfile } from '@/lib/user'
import AppMenubar from '@/components/menubar'

export async function AppMenubarServer() {
  const user = await getCurrentUserProfile()

  return (
    <AppMenubar
      user={
        user
          ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl }
          : null
      }
    />
  )
}
