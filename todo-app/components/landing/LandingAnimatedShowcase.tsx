'use client'

import { LandingAppShowcase } from './LandingAppShowcase'

interface LandingAnimatedShowcaseProps {
  delay?: number
}

export function LandingAnimatedShowcase({ delay = 0 }: LandingAnimatedShowcaseProps) {
  return (
    <div
      className="landing-animate-showcase transition-transform duration-500 hover:scale-[1.015] motion-reduce:hover:scale-100"
      style={{ animationDelay: `${delay}ms` }}
    >
      <LandingAppShowcase />
    </div>
  )
}
