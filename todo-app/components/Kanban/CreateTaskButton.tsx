// components/CreateTask/CreateTaskButton.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function CreateTaskButton() {
  return (
    <Button variant="brand" asChild>
      <Link href="/tasks/create-task">
        <Plus className="size-4" /> New task
      </Link>
    </Button>
  )
}