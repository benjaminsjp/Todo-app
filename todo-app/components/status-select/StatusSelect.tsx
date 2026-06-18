"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusOption, StatusSelectProps } from "@/lib/types"
import { DEFAULT_STATUS_LABELS } from "@/lib/statusDefaults"


export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { value: DEFAULT_STATUS_LABELS.todo,        label: DEFAULT_STATUS_LABELS.todo,        color: "bg-muted-foreground"   },
  { value: DEFAULT_STATUS_LABELS.inProgress, label: DEFAULT_STATUS_LABELS.inProgress, color: "bg-blue-500" },
  { value: DEFAULT_STATUS_LABELS.done,        label: DEFAULT_STATUS_LABELS.done,        color: "bg-green-500"  },
]

export default function StatusSelect({
  value,
  onChange,
  options = DEFAULT_STATUS_OPTIONS,
  className,
}: StatusSelectProps) {
  const current = options.find(o => o.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className={`w-auto border-0 bg-secondary text-xs px-3 rounded-full ${className ?? ""}`}>
        <SelectValue>
          <span className={`${current?.color ?? "bg-gray-400"} h-2 w-2 rounded-full`} />
          <span>{current?.label ?? value}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="p-1 ">
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span className={`${option.color} h-2 w-2 rounded-full`} />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
