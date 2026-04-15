'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface Props {
  orgId?: number
}

export function CreateTaskButton({ orgId }: Props) {
  return (
    <Button variant="brand" asChild>
      <Link href={orgId ? `/tasks/create-task?orgId=${orgId}` : '/tasks/create-task'}>
        <Plus className="size-4" /> Ny task
      </Link>
    </Button>
  )
}