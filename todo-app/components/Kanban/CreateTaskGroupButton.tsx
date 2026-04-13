'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateTaskGroupModal } from './CreateTaskGroupModal'

export function CreateTaskGroupButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Ny task
      </Button>
      <CreateTaskGroupModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}