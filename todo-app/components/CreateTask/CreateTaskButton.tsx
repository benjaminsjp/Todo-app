'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface Props {
  orgId?: number
  children?: React.ReactNode
}

export function CreateTaskButton({ orgId, children }: Props) {
  return (
    <>
    {!children ? (
      <Button asChild >
        <Link  href={orgId ? `/tasks/create-task?orgId=${orgId}` : '/tasks/create-task'}>
            <Plus className="size-4" /> New task
          </Link>
      </Button>
    ) : (
      <Link href={orgId ? `/tasks/create-task?orgId=${orgId}` : '/tasks/create-task'}>
        {children}
      </Link>
    )}  
    </>
  )
}