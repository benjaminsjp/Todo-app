import { Metadata } from 'next'
import { TasksWidget } from '@/components/Dashboard/TasksWidget'
import { PlaceholderWidget } from '@/components/Dashboard/PlaceholderWidget'
import { NotebookPen, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: "På'n – Få fart på oppgavelisten din",
  description: 'Planlegg og fullfør oppgaver effektivt med På\'n.',
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-medium font-heading text-heading-strong">
            Welcome back!
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
