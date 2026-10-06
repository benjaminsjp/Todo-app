'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Props {
  orgId?:    number
  children?: React.ReactNode
}

function createTaskHref(pathname: string) {
  const orgSlug = pathname.startsWith('/org/')
    ? pathname.split('/')[2]
    : null
  return orgSlug ? `/org/${orgSlug}/create-task` : '/tasks/create-task'
}

export function CreateTaskButton({ children }: Props) {
  const pathname = usePathname()
  const href = createTaskHref(pathname)

  if (children) {
    return (
      <Link href={href} prefetch className="contents">
        {children}
      </Link>
    )
  }

  return (
    <Button asChild>
      <Link href={href} prefetch>
        <Plus className="size-4" /> Ny oppgave
      </Link>
    </Button>
  )
}