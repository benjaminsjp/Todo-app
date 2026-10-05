'use client'

import { useSetBreadcrumbLabel } from './BreadcrumbsContext'

export function SetBreadcrumbLabel({
  segment,
  label,
}: {
  segment: string
  label: string
}) {
  useSetBreadcrumbLabel(segment, label)
  return null
}
