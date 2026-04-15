'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateTaskGroupModal } from './CreateTaskGroupModal'

export function CreateTaskGroupButton({ orgId }: { orgId?: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> New group
      </Button>
      <CreateTaskGroupModal open={open} onClose={() => setOpen(false)} orgId={orgId} />
    </>
  )
}
