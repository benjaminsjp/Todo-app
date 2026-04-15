// components/sidebar/AppSidebarOrgSwitcher.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Plus, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CreateOrgModal } from "@/components/CreateOrg/CreateOrgModal"

type Org = {
  id:   number
  name: string
  slug: string
}

export function OrgSwitcher({
  orgs,
  currentSlug,
}: {
  orgs:         Org[]
  currentSlug?: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const activeOrg = orgs.find((o) => o.slug === currentSlug) ?? orgs[0] ?? null

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="w-fit px-1.5">
                <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-3" />
                </div>
                <span className="truncate font-medium">
                  {activeOrg?.name ?? 'Personlig'}
                </span>
                <ChevronDown className="opacity-50" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organisasjoner
              </DropdownMenuLabel>

              {/* Personal workspace */}
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => router.push('/tasks')}
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <Building2 className="size-4 shrink-0" />
                </div>
                Personlig
              </DropdownMenuItem>

              {orgs.length > 0 && <DropdownMenuSeparator />}

              {orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className="gap-2 p-2"
                  onClick={() => router.push(`/org/${org.slug}`)}
                >
                  <div className="flex size-6 items-center justify-center rounded-xs border">
                    <Building2 className="size-4 shrink-0" />
                  </div>
                  {org.name}
                  {org.slug === activeOrg?.slug && (
                    <span className="ml-auto text-xs text-muted-foreground">Aktiv</span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2" onClick={() => setOpen(true)}>
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">Ny organisasjon</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrgModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}