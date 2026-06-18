'use client'

import { LandingAppShowcase } from './LandingAppShowcase'

interface LandingAnimatedShowcaseProps {
  delay?: number
}

export function LandingAnimatedShowcase({ delay = 0 }: LandingAnimatedShowcaseProps) {
  return (
    <div
      className="landing-animate-showcase"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="landing-showcase-hover motion-reduce:transition-none">
        <LandingAppShowcase />
      </div>
    </div>
  )
}
