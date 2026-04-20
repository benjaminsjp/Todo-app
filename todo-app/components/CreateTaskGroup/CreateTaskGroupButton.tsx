'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TaskGroupModal } from './TaskGroupModal'

export function CreateTaskGroupButton({ orgId, children }: { orgId?: number; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!children ? (
        <Button variant="ghost" className='border-dashed border-border' onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New group
        </Button>
      ) : (
        <div onClick={() => setOpen(true)} >
          {children}
        </div>
      )}
      <TaskGroupModal open={open} onClose={() => setOpen(false)} orgId={orgId} />
    </>
  )
}
