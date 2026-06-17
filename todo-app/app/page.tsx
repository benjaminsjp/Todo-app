import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { LandingPage } from '@/components/landing/LandingPage'
import { isDemoConfigured, isDemoUser } from '@/lib/demo/config'

export const metadata: Metadata = {
  title: "På'n – Task management for teams and individuals",
  description:
    'Plan, track, and complete tasks with Kanban boards, organizations, and real-time collaboration.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: session } = await auth.getSession()

  return (
    <LandingPage
      demoEnabled={isDemoConfigured()}
      isAuthenticated={Boolean(session?.user)}
      isDemoSession={isDemoUser(session?.user)}
    />
  )
}
