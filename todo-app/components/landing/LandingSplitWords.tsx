'use client'

import { cn } from '@/lib/utils'

interface LandingSplitWordsProps {
  text: string
  className?: string
  delay?: number
  stagger?: number
  play?: boolean
}

export function LandingSplitWords({
  text,
  className,
  delay = 0,
  stagger = 52,
  play = true,
}: LandingSplitWordsProps) {
  const words = text.split(/(\s+)/)

  if (!play) {
    return <span className={cn('invisible', className)} aria-hidden>{text}</span>
  }

  let wordIndex = 0

  return (
    <p className={className} aria-label={text}>
      {words.map((part, index) => {
        if (/^\s+$/.test(part)) {
          return <span key={`space-${index}`}>{part}</span>
        }

        const current = wordIndex
        wordIndex += 1

        return (
          <span
            key={`${part}-${index}`}
            className="landing-animate-word inline-block will-change-transform"
            style={{ animationDelay: `${delay + current * stagger}ms` }}
            aria-hidden
          >
            {part}
          </span>
        )
      })}
    </p>
  )
}
