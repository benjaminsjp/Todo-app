"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CreateTaskDeadlineProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
}

export function CreateTaskDeadline({ value, onChange, disabled }: CreateTaskDeadlineProps) {
  const [date, setDate] = React.useState<Date | undefined>(value)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    onChange?.(selectedDate)
  }

  if (disabled) {
    return (
      <Button
        variant="outline"
        disabled
        data-empty={!date}
        className="grow justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
      >
        <CalendarIcon />
        {date ? format(date, "PPP") : <span>Pick a date</span>}
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className=" grow justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={handleDateSelect} />
      </PopoverContent>
    </Popover>
  )
}