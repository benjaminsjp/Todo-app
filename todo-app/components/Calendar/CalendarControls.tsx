'use client'

import { Building2, ChevronLeft, ChevronRight, Folder } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CalendarFilterMode, CalendarViewMode } from '@/lib/taskCalendar'
import { getColor, type TaskGroup } from '@/lib/types'

type OrgOption = {
  id: number
  name: string
  slug: string
}

interface CalendarControlsProps {
  orgs: OrgOption[]
  taskGroups: TaskGroup[]
  selectedOrgSlug: string
  filter: CalendarFilterMode
  selectedGroup: string
  view: CalendarViewMode
  onOrgChange: (orgSlug: string) => void
  onFilterChange: (filter: CalendarFilterMode) => void
  onGroupChange: (group: string) => void
  onViewChange: (view: CalendarViewMode) => void
  onPrevPeriod: () => void
  onNextPeriod: () => void
}

export function CalendarControls({
  orgs,
  taskGroups,
  selectedOrgSlug,
  filter,
  selectedGroup,
  view,
  onOrgChange,
  onFilterChange,
  onGroupChange,
  onViewChange,
  onPrevPeriod,
  onNextPeriod,
}: CalendarControlsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="size-4" />
              Organisasjon
            </div>
            <Select value={selectedOrgSlug} onValueChange={onOrgChange}>
              <SelectTrigger className="min-w-60">
                <SelectValue placeholder="Velg organisasjon" />
              </SelectTrigger>
              <SelectContent position="popper" className="p-1">
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.slug}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="size-4" />
              Gruppe
            </div>
            <Select value={selectedGroup} onValueChange={onGroupChange}>
              <SelectTrigger className="min-w-52">
                <SelectValue placeholder="Alle grupper" />
              </SelectTrigger>
              <SelectContent position="popper" className="p-1">
                <SelectItem value="all">Alle grupper</SelectItem>
                <SelectItem value="none">Uten gruppe</SelectItem>
                {taskGroups.map((group) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    <span className="flex items-center gap-2">
                      <span
                        className={`size-2 shrink-0 rounded-full ${getColor(group.color).bg}`}
                      />
                      {group.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value === 'week' || value === 'month') {
                onViewChange(value)
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="week">Uke</ToggleGroupItem>
            <ToggleGroupItem value="month">Måned</ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => {
              if (value === 'org' || value === 'mine') {
                onFilterChange(value)
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="org">Alle i org</ToggleGroupItem>
            <ToggleGroupItem value="mine">Mine oppgaver</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrevPeriod}>
              <ChevronLeft className="size-4" />
              {view === 'month' ? 'Forrige måned' : 'Forrige uke'}
            </Button>
            <Button variant="outline" size="sm" onClick={onNextPeriod}>
              {view === 'month' ? 'Neste måned' : 'Neste uke'}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
