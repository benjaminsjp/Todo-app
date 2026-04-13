'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateTaskModal } from './CreateTaskModal'

export function CreateTaskButton({ taskGroups }: { taskGroups: { id: number; title: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant='brand' onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Ny task
      </Button>
      <CreateTaskModal open={open} onClose={() => setOpen(false)} taskGroups={taskGroups} />
    </>
  )
}