'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LandingRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  /** Use fade (not transform) when wrapping hover-lift cards */
  motion?: 'rise' | 'fade'
}

export function LandingReveal({ children, className, delay = 0, motion = 'rise' }: LandingRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
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
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        visible
          ? motion === 'fade'
            ? 'landing-animate-fade'
            : 'landing-animate-rise'
          : 'opacity-0',
        motion === 'rise' && !visible && 'translate-y-3',
        'motion-reduce:opacity-100 motion-reduce:translate-y-0',
        className,
      )}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
