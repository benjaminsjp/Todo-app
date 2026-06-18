import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { LandingPage } from '@/components/landing/LandingPage'
import { isDemoConfigured, isDemoUser } from '@/lib/demo/config'

export const metadata: Metadata = {
  title: "På'n – Oppgavestyring for team og enkeltpersoner",
  description:
    'Planlegg, følg opp og fullfør oppgaver med Kanban-tavler, organisasjoner og sanntidssamarbeid.',
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
