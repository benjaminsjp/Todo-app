// components/sidebar/AppSidebarOrgSwitcher.tsx
"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, Plus, Building2 } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CreateOrgModal } from "@/components/CreateOrg/CreateOrgModal"

type Org = { id: number; name: string; slug: string }

export function OrgSwitcher({ orgs }: { orgs: Org[] }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const currentSlug = pathname.startsWith('/org/') ? pathname.split('/')[2] : undefined
  const activeOrg   = orgs.find((o) => o.slug === currentSlug) ?? null

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="w-fit h-fit p-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                  <Building2 className="size-3" />
                </div>
                <span className="truncate font-medium">
                  {activeOrg?.name ?? 'Personal'}
                </span>
                <ChevronDown className="opacity-50" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start" side="bottom" sideOffset={4}>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>

              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => router.push('/tasks')}
              >
                <div className="flex size-7 items-center justify-center rounded-sm border">
                  <Building2 className="size-4 shrink-0" />
                </div>
                Personal
                {!activeOrg && (
                  <span className="ml-auto text-xs text-muted-foreground pr-2">Active</span>
                )}
              </DropdownMenuItem>

              {orgs.length > 0 && <DropdownMenuSeparator />}

              {orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className="gap-2 p-2"
                  onClick={() => router.push(`/org/${org.slug}`)}
                >
                  <div className="flex size-7 items-center justify-center rounded-sm border">
                    <Building2 className="size-4 shrink-0" />
                  </div>
                  {org.name}
                  {org.slug === currentSlug && (
                    <span className="ml-auto text-xs text-muted-foreground pr-2">Active</span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2" onClick={() => setOpen(true)}>
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">New Organization</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrgModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}