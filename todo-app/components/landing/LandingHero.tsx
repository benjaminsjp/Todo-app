'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemoButton } from './DemoButton'
import { LandingAnimatedShowcase } from './LandingAnimatedShowcase'
import { LandingSplitText } from './LandingSplitText'
import { LANDING_HERO_STAGGER } from './motion'

const EYEBROW = 'Oppgavetavle · Personlig og team'
const LINE_ONE = 'Få fart på'
const LINE_TWO = 'oppgavelisten din.'
const DESCRIPTION =
  'På\'n er et fokusert arbeidsområde for å flytte oppgaver på en Kanban-tavle, gruppere dem i sidepanelet, og åpne delte org-tavler når du trenger mer enn en solo-liste.'

const STATS = [
  { label: 'Tavle', value: 'Dra-og-slipp Kanban' },
  { label: 'Sidepanel', value: 'Grupper og hurtignav' },
  { label: 'Orger', value: 'Delte sanntidstavler' },
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
                  Kom i gang gratis
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
          <div
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center landing-animate-rise"
            style={{ animationDelay: `${bodyStart + 50}ms` }}
          >
            <Button variant="brand" size="lg" asChild>
              <Link href="/dashboard">
                Gå til dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {isDemoSession && (
              <p className="text-sm text-muted-foreground sm:max-w-xs">
                Du er i demomodus — endringer deles med andre besøkende.
              </p>
            )}
          </div>
        )}

        {!isAuthenticated && demoEnabled && (
          <p
            className="mt-4 text-sm text-muted-foreground landing-animate-rise"
            style={{ animationDelay: `${bodyStart + 120}ms` }}
          >
            Prøv demoen for å gå gjennom eksempeloppgaver og en eksempel-org — uten registrering.
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
