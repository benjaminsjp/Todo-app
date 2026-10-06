// components/sidebar/AppSidebarOrgSwitcher.tsx
"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Check, Plus, Building2 } from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import {
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CreateOrgModal } from "@/components/CreateOrg/CreateOrgModal"
import { cn } from "@/lib/utils"

type Org = { id: number; name: string; slug: string }

type OrgOption = {
  value: string
  label: string
  href: string
}

const PERSONAL: OrgOption = {
  value: "personal",
  label: "Personlig",
  href: "/tasks",
}

export function OrgSwitcher({ orgs }: { orgs: Org[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const orgItems = React.useMemo<OrgOption[]>(
    () =>
      orgs.map((org) => ({
        value: org.slug,
        label: org.name,
        href: `/org/${org.slug}`,
      })),
    [orgs],
  )

  const currentSlug = pathname.startsWith("/org/") ? pathname.split("/")[2] : undefined
  const selected =
    (currentSlug
      ? orgItems.find((item) => item.value === currentSlug)
      : PERSONAL) ?? PERSONAL
  const isPersonal = selected.value === "personal"

  return (
    <>
      <SidebarMenu className="min-w-0 flex-1">
        <SidebarMenuItem className="min-w-0">
          <Combobox
            items={orgItems}
            value={isPersonal ? null : selected}
            onValueChange={(item) => {
              if (!item) return
              router.push(item.href)
            }}
            itemToStringLabel={(item) => item.label}
            isItemEqualToValue={(a, b) => a.value === b.value}
            open={open}
            onOpenChange={setOpen}
          >
            <ComboboxTrigger
              render={
                <SidebarMenuButton className="h-fit w-full min-w-0 p-2" />
              }
              className="w-full min-w-0 justify-start"
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Building2 className="size-3" />
              </div>
              <span className="min-w-0 flex-1 truncate text-left font-medium">
                {selected.label}
              </span>
            </ComboboxTrigger>

            <ComboboxContent
              className="w-64 *:data-[slot=input-group]:m-0 *:data-[slot=input-group]:h-8"
              align="start"
              sideOffset={4}
            >
              <div className="p-1">
                <button
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default items-center gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground",
                    isPersonal && "bg-accent text-accent-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpen(false)
                    router.push(PERSONAL.href)
                  }}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-sm border">
                    <Building2 className="size-4 shrink-0" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-left">
                    {PERSONAL.label}
                  </span>
                  {isPersonal && (
                    <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                      <Check className="size-4" />
                    </span>
                  )}
                </button>
              </div>

              <ComboboxSeparator />

              <div className="px-1.5 pb-1 pt-1.5">
                <ComboboxInput
                  placeholder="Søk organisasjon..."
                  showTrigger={false}
                  className="h-8 w-full min-w-0 rounded-xl shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-foreground/25 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
                />
              </div>

              <ComboboxEmpty>Ingen treff</ComboboxEmpty>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item.value} value={item}>
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-sm border">
                      <Building2 className="size-4 shrink-0" />
                    </div>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>

              <ComboboxSeparator />
              <div className="p-1">
                <button
                  type="button"
                  className="flex w-full cursor-default items-center gap-2 rounded-xl px-3 py-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpen(false)
                    setCreateOpen(true)
                  }}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Ny organisasjon
                  </span>
                </button>
              </div>
            </ComboboxContent>
          </Combobox>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrgModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
