'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface LandingCascadeItem {
  icon: ReactNode
  children: ReactNode
}

interface LandingCascadeListProps {
  items: readonly LandingCascadeItem[]
  className?: string
  stagger?: number
}

export function LandingCascadeList({
  items,
  className,
  stagger = 110,
}: LandingCascadeListProps) {
  const ref = useRef<HTMLUListElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <ul ref={ref} className={cn('space-y-4 text-sm', className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cn(
            'flex gap-3',
            visible ? 'landing-animate-cascade' : 'opacity-0',
            'motion-reduce:opacity-100',
          )}
          style={visible ? { animationDelay: `${index * stagger}ms` } : undefined}
        >
          <span className="mt-0.5 shrink-0 text-muted-foreground [&>svg]:size-4">
            {item.icon}
          </span>
          <span>{item.children}</span>
        </li>
      ))}
    </ul>
  )
}
