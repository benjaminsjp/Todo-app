'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateOrgModal } from './CreateOrgModal'
import { Button } from '@/components/ui/button'

export function CreateOrgButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-2xl h-full border border-dashed border-border bg-transparent p-6 flex flex-col items-center justify-center gap-3 min-h-32 w-full hover:border-foreground/30 hover:bg-muted/30 transition-all duration-200 cursor-pointer group"
      >
        <div className="rounded-full border border-dashed border-border p-3 group-hover:border-foreground/30 transition-colors">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Ny organisasjon
        </span>
      </Button>

      <CreateOrgModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}