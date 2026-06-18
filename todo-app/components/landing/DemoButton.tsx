'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DemoButtonProps {
  enabled?: boolean
  size?: 'default' | 'lg' | 'sm' | 'xs' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary' | 'brand'
  className?: string
}

export function DemoButton({
  enabled = false,
  size = 'default',
  variant = 'default',
  className,
}: DemoButtonProps) {
  if (!enabled) return null

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href="/auth/demo">Prøv demo</Link>
    </Button>
  )
}
