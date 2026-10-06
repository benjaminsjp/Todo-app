'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Props {
  orgId?:     number
  statusId?:  number
  children?:  React.ReactNode
}

export function createTaskHref(pathname: string, statusId?: number) {
  const orgSlug = pathname.startsWith('/org/')
    ? pathname.split('/')[2]
    : null
  const base = orgSlug ? `/org/${orgSlug}/create-task` : '/tasks/create-task'
  if (statusId == null) return base
  return `${base}?statusId=${statusId}`
}

export function CreateTaskButton({ statusId, children }: Props) {
  const pathname = usePathname()
  const href = createTaskHref(pathname, statusId)

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
