import { Metadata } from 'next'
import { TasksWidget } from '@/components/Dashboard/TasksWidget'
import { PlaceholderWidget } from '@/components/Dashboard/PlaceholderWidget'
import { NotebookPen, Calendar, BarChart2 } from 'lucide-react'
import { auth } from '@/lib/auth/server'
import Link from 'next/link'
export const metadata: Metadata = {
  title: "På'n – Få fart på oppgavelisten din",
  description: 'Planlegg og fullfør oppgaver effektivt med På\'n.',
}
import { syncUser } from '@/lib/db/users'
import { Button } from '@/components/ui/button'


export const dynamic = 'force-dynamic'

export default async function Home() {


  let session = null
  try {
    const result = await auth.getSession()
    session = result?.data
    if (session?.user) await syncUser(session.user)
  } catch (e) {
    console.error('Auth feil:', e)
  }

  if (session?.user) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-medium font-heading text-heading-strong">
              Welcome back, {session?.user?.name}! 
            </h1>
            <p className="text-muted-foreground mt-4">Here's an overview of what's happening.</p>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            <TasksWidget />
            <PlaceholderWidget
              title="Notater"
              icon={NotebookPen}
              description="Skriv og organiser notater, ideer og tanker på ett sted."
            />
            <PlaceholderWidget
              title="Kalender"
              icon={Calendar}
              description="Få oversikt over kommende deadlines og hendelser."
            />
          </div>
        </div>
      </div>
    )

  }
  return(
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 max-w-sm mx-auto px-4">
      <div className="text-center">
        <h1 className="text-4xl font-heading font-medium mb-1">
          Welcome to På'n!
        </h1>
        <p className="text-muted-foreground">Plan and organize your tasks efficiently.</p>
      </div>
      <Button variant="brand" size="lg" asChild>
        <Link href="/api/auth/sign-in">
          Login or Sign Up to get started!
        </Link>
      </Button>
    </div>    
  )
}