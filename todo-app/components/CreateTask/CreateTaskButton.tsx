'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Props {
  orgId?:    number
  children?: React.ReactNode
}

export function CreateTaskButton({ orgId, children }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const handleClick = () => {
    const orgSlug = pathname.startsWith('/org/')
      ? pathname.split('/')[2]
      : null

    if (orgSlug) {
      router.push(`/org/${orgSlug}/create-task`)
    } else {
      router.push('/tasks/create-task')
    }
  }

  if (children) {
    return <span onClick={handleClick}>{children}</span>
  }

  return (
    <Button onClick={handleClick}>
      <Plus className="size-4" /> New task
    </Button>
  )
}