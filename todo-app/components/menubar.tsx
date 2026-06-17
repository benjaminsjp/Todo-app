'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSubTrigger, DropdownMenuSub,
  DropdownMenuTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Moon, Sun, SunMoon, Brush, UserRound, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { AppBreadcrumbs } from './Breadcrumbs/Breadcrumbs'
import { NotificationCenter } from './NotificationCenter'

export default function AppMenubar() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [user, setUser] = useState<{
    name?:  string | null
    email?: string | null
    avatarUrl?: string | null
  } | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((data) => { if (data) setUser(data) })
  }, [])

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/auth/sign-in'
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="w-full border-b sticky top-0 bg-background z-40">
      <div className="container mx-auto flex py-4 items-center gap-8 px-8">
        <AppBreadcrumbs />

        <div className="ml-auto flex items-center gap-3">
          <NotificationCenter />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="rounded-full h-10 w-10">
                <Avatar size="lg">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name ?? ''} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/account')}>
                  <UserRound className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Brush className="size-4" /> Appearance
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                        <DropdownMenuRadioItem value="dark"><Moon className="size-4" /> Dark</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="light"><Sun className="size-4" /> Light</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system"><SunMoon className="size-4" /> System</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}