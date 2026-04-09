"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type StatusOption = {
  value: string
  label: string
  color: string
}

type StatusSelectProps = {
  value: string
  onChange: (value: string) => void
  options?: StatusOption[]
  className?: string
}

export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { value: "Todo",        label: "Todo",        color: "bg-blue-500"   },
  { value: "In Progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "Done",        label: "Done",        color: "bg-green-500"  },
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
      <SelectTrigger size="sm" className={`w-auto text-xs px-3 rounded-full ${className ?? ""}`}>
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