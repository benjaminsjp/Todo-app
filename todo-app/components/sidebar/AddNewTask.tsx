import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"

import { Plus, FolderPlus } from "lucide-react"

export function AddNewTask() {
  return (
    <div className="flex gap-2">
        <Tooltip>
        <TooltipTrigger asChild>
            <Link href='/tasks/create-task'>
                <Button variant="secondary" size="sm" data-icon="inline-start" className="cursor-pointer">
                        <Plus />Ny oppgave
                </Button>
            </Link>
        </TooltipTrigger>
        <TooltipContent>
            <p>Opprett ny oppgave</p>
        </TooltipContent>
        </Tooltip>
        <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="secondary" size="icon-sm"><FolderPlus /></Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>Opprett ny oppgavegruppe</p>
        </TooltipContent>
        </Tooltip>
    </div>
  )
}
