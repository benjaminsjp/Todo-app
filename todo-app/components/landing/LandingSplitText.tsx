'use client'

import { cn } from '@/lib/utils'

interface LandingSplitTextProps {
  text: string
  className?: string
  delay?: number
  stagger?: number
  play?: boolean
  tone?: 'default' | 'subtle' | 'hero'
}

export function LandingSplitText({
  text,
  className,
  delay = 0,
  stagger = 34,
  play = true,
  tone = 'default',
}: LandingSplitTextProps) {
  if (!play) {
    return (
      <span className={cn('invisible', className)} aria-hidden>
        {text}
      </span>
    )
  }

  const charClass =
    tone === 'hero'
      ? 'landing-animate-char-hero'
      : tone === 'subtle'
        ? 'landing-animate-char-subtle'
        : 'landing-animate-char'

  const parts = text.split(/(\s+)/)
  let charIndex = 0

  return (
    <span className={className} aria-label={text}>
      {parts.map((part, partIndex) => {
        if (/^\s+$/.test(part)) {
          charIndex += part.length
          return (
            <span key={`space-${partIndex}`} aria-hidden>
              {part}
            </span>
          )
        }

        return (
          <span
            key={`word-${partIndex}-${part}`}
            className="inline-block whitespace-nowrap"
            aria-hidden
          >
            {Array.from(part).map((char, index) => {
              const currentIndex = charIndex
              charIndex += 1

              return (
                <span
                  key={`${char}-${index}`}
                  className={cn(charClass, 'inline-block origin-bottom will-change-transform')}
                  style={{
                    animationDelay: `${delay + currentIndex * stagger}ms`,
                    ['--char-tilt' as string]: currentIndex % 2 === 0 ? '5deg' : '-4deg',
                  }}
                >
                  {char}
                </span>
              )
            })}
          </span>
        )
      })}
    </span>
  )
}
