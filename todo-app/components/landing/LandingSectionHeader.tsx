'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { LandingSplitText } from './LandingSplitText'
import { LANDING_HERO_STAGGER, titleCharsEnd } from './motion'

interface LandingSectionHeaderProps {
  title: string
  description: string
  titleClassName?: string
  descriptionClassName?: string
}

export function LandingSectionHeader({
  title,
  description,
  titleClassName,
  descriptionClassName,
}: LandingSectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlay(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlay(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const descriptionDelay = play ? titleCharsEnd(0, title) + 30 : 0

  return (
    <div ref={ref} className="max-w-2xl">
      <h2 className={titleClassName}>
        <LandingSplitText
          text={title}
          play={play}
          stagger={LANDING_HERO_STAGGER}
          tone="hero"
        />
      </h2>
      <p
        className={cn(
          descriptionClassName,
          play ? 'landing-animate-rise' : 'opacity-0 motion-reduce:opacity-100',
        )}
        style={play ? { animationDelay: `${descriptionDelay}ms` } : undefined}
      >
        {description}
      </p>
    </div>
  )
}
