'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemoButton } from './DemoButton'
import { LandingAnimatedShowcase } from './LandingAnimatedShowcase'
import { LandingSplitText } from './LandingSplitText'
import { LANDING_HERO_STAGGER } from './motion'

const EYEBROW = 'Task board · Personal & team'
const LINE_ONE = 'Få fart på'
const LINE_TWO = 'oppgavelisten din.'
const DESCRIPTION =
  "På'n is a focused workspace for moving tasks across a Kanban board, grouping them in the sidebar, and opening shared org boards when you need more than a solo list."

const STATS = [
  { label: 'Board', value: 'Drag & drop Kanban' },
  { label: 'Sidebar', value: 'Groups & quick nav' },
  { label: 'Orgs', value: 'Shared realtime boards' },
] as const

interface LandingHeroProps {
  demoEnabled: boolean
  isAuthenticated: boolean
  isDemoSession: boolean
}

export function LandingHero({
  demoEnabled,
  isAuthenticated,
  isDemoSession,
}: LandingHeroProps) {
  const lineOneStart = 100
  const lineTwoStart = lineOneStart + LINE_ONE.length * LANDING_HERO_STAGGER + 28
  const bodyStart = lineTwoStart + 50
  const showcaseStart = 160

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)] lg:items-center lg:gap-14 lg:py-32">
      <div>
        <p
          className="mb-4 font-heading text-sm uppercase tracking-[0.2em] text-primary landing-animate-rise"
          style={{ animationDelay: '40ms' }}
        >
          {EYEBROW}
        </p>

        <h1 className="font-heading text-4xl font-medium leading-[1.08] text-heading-strong sm:text-5xl lg:text-[3.4rem]">
          <LandingSplitText
            text={LINE_ONE}
            delay={lineOneStart}
            stagger={LANDING_HERO_STAGGER}
            tone="hero"
            className="block"
          />
          <LandingSplitText
            text={LINE_TWO}
            delay={lineTwoStart}
            stagger={LANDING_HERO_STAGGER}
            tone="hero"
            className="block text-primary"
          />
        </h1>

        <p
          className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground landing-animate-rise"
          style={{ animationDelay: `${bodyStart}ms` }}
        >
          {DESCRIPTION}
        </p>

        {!isAuthenticated && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className="landing-animate-rise"
              style={{ animationDelay: `${bodyStart + 50}ms` }}
            >
              <Button variant="brand" size="lg" asChild>
                <Link href="/auth/sign-in">
                  Start for free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div
              className="landing-animate-rise"
              style={{ animationDelay: `${bodyStart + 90}ms` }}
            >
              <DemoButton enabled={demoEnabled} size="lg" variant="outline" />
            </div>
          </div>
        )}

        {isAuthenticated && (
          <p
            className="mt-6 text-sm text-muted-foreground landing-animate-rise"
            style={{ animationDelay: `${bodyStart + 50}ms` }}
          >
            {isDemoSession
              ? "You're in the demo — open the app to keep exploring, or exit from the header."
              : 'Welcome back. Pick up where you left off from the header.'}
          </p>
        )}

        {!isAuthenticated && demoEnabled && (
          <p
            className="mt-4 text-sm text-muted-foreground landing-animate-rise"
            style={{ animationDelay: `${bodyStart + 120}ms` }}
          >
            Try the demo to walk through sample tasks and an example org — no signup.
          </p>
        )}

        <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border/70 pt-8 text-sm">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="landing-animate-rise"
              style={{ animationDelay: `${bodyStart + 140 + index * 40}ms` }}
            >
              <dt className="text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 font-medium">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div id="preview" className="min-w-0 w-full">
        <LandingAnimatedShowcase delay={showcaseStart} />
      </div>
    </div>
  )
}
