import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Group, Plus, Kanban, FolderPlus } from "lucide-react"

export function AddNewTask() {
  return (
    <div className="flex gap-2">
        <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="secondary" size="sm" data-icon="inline-start"><Plus />New task</Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>Create new task</p>
        </TooltipContent>
        </Tooltip>
        <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="secondary" size="icon-sm"><FolderPlus /></Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>Create new task group</p>
        </TooltipContent>
        </Tooltip>
    </div>
  )
}
