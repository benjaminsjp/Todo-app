import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DemoButton } from './DemoButton'
import { LandingSessionActions } from './LandingSessionActions'
import { LandingHero } from './LandingHero'
import { LandingReveal } from './LandingReveal'
import { LandingCascadeList } from './LandingCascadeList'
import { LandingSectionHeader } from './LandingSectionHeader'
import { LandingTaskPreviewCard } from './LandingTaskPreviewCard'
import {
  ArrowRight,
  CircleDashed,
  GripVertical,
  Users,
} from 'lucide-react'

const personalHighlights = [
  {
    icon: <CircleDashed />,
    children: (
      <>
        Personal tasks live under{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/tasks</code> with your statuses
        and groups.
      </>
    ),
  },
  {
    icon: <Users />,
    children: (
      <>
        Org boards live under{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/org/your-team</code> with invites
        and member roles.
      </>
    ),
  },
  {
    icon: <GripVertical />,
    children: (
      <>
        Drag cards on the board <em>or</em> drag tasks between groups in the sidebar — both update
        the same task.
      </>
    ),
  },
] as const

interface LandingPageProps {
  demoEnabled: boolean
  isAuthenticated: boolean
  isDemoSession: boolean
}

const workflow = [
  {
    step: '01',
    title: 'Your own board, out of the box',
    body: 'Every account gets a personal Kanban with Todo, In Progress, and Done columns. Drag cards between statuses, set deadlines, and add rich-text descriptions — no setup wizard required.',
    detail: 'Statuses use icons and colors you can customize later.',
  },
  {
    step: '02',
    title: 'Sidebar groups keep related work together',
    body: 'Tasks don\'t have to live in a flat list. Drop them into colored groups like "Getting started" or "Sprint 12", then drag between groups from the sidebar without losing context.',
    detail: 'Ungrouped tasks stay visible at the top until you organize them.',
  },
  {
    step: '03',
    title: 'Organizations when the work gets shared',
    body: 'Create a workspace for your team, invite members by email, and switch between Personal and org views from the sidebar. Each org gets its own board, statuses, and task groups.',
    detail: 'Roles cover owners, admins, members, and viewers.',
  },
  {
    step: '04',
    title: 'Live updates while you collaborate',
    body: 'Org boards sync in real time over SSE. See when someone else is editing a task — a red presence dot means hands off, green means they\'re just looking.',
    detail: 'Comments and revision history keep the thread on each card.',
  },
]

export function LandingPage({
  demoEnabled,
  isAuthenticated,
  isDemoSession,
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md landing-animate-rise" style={{ animationDelay: '40ms' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-heading text-2xl font-medium text-heading-strong tracking-tight">
            På&apos;n
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground hover:translate-y-px">How it works</a>
            <a href="#preview" className="transition-colors hover:text-foreground hover:translate-y-px">In the app</a>
          </nav>
          {isAuthenticated ? (
            <LandingSessionActions isDemoSession={isDemoSession} />
          ) : (
            <Button variant="secondary" size="sm" asChild>
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, oklch(0.78 0.12 75 / 0.25), transparent 45%),
                radial-gradient(circle at 80% 0%, oklch(0.45 0.08 70 / 0.12), transparent 40%)`,
            }}
          />
          <LandingHero
            demoEnabled={demoEnabled}
            isAuthenticated={isAuthenticated}
            isDemoSession={isDemoSession}
          />
        </section>

        <section id="how-it-works" className="border-b border-border/60 bg-surface-2/40 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <LandingSectionHeader
              title="What you actually do in På'n"
              description="Not another abstract “productivity suite”. Here's the loop most people follow on day one."
              titleClassName="font-heading text-3xl font-medium text-heading-strong md:text-4xl"
              descriptionClassName="mt-4 text-lg text-muted-foreground"
            />

            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              {workflow.map((item, index) => (
                <LandingReveal key={item.step} delay={index * 120}>
                  <article className="relative h-full rounded-2xl border bg-card p-8 pl-10 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-brand/35 hover:shadow-lg hover:shadow-brand/10">
                  <span
                    className="absolute left-0 top-8 -translate-x-1/2 rounded-full border bg-background px-3 py-1 font-mono text-xs text-primary landing-animate-pop"
                    style={{ animationDelay: `${index * 120 + 420}ms` }}
                  >
                    {item.step}
                  </span>
                  <h3 className="font-heading text-xl font-medium text-heading-strong">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{item.body}</p>
                  <p className="mt-4 text-sm text-foreground/70">{item.detail}</p>
                  </article>
                </LandingReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-start gap-12 lg:grid-cols-2">
              <div>
                <LandingSectionHeader
                  title="Personal today, shared tomorrow"
                  description="Start on Personal with your own tasks and groups. When a project needs more people, spin up an organization — the UI stays familiar, but the board belongs to everyone on the team."
                  titleClassName="font-heading text-3xl font-medium text-heading-strong"
                  descriptionClassName="mt-4 text-muted-foreground leading-relaxed"
                />

                <LandingCascadeList items={personalHighlights} className="mt-8" />
              </div>

              <LandingReveal delay={120}>
                <LandingTaskPreviewCard />
              </LandingReveal>
            </div>
          </div>
        </section>

        {!isAuthenticated && (
          <section className="border-t border-border/60 bg-surface-2/50 py-16">
            <LandingReveal>
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
              <LandingSectionHeader
                title="See it with your own clicks"
                description={
                  demoEnabled
                    ? 'The demo loads a personal board and an Acme Team org with sample tasks already in place.'
                    : 'Create an account and your board is ready with default columns in seconds.'
                }
                titleClassName="font-heading text-2xl font-medium text-heading-strong"
                descriptionClassName="mt-2 max-w-md text-muted-foreground"
              />
              <div className="flex flex-col gap-3 sm:flex-row landing-animate-rise" style={{ animationDelay: '120ms' }}>
                {demoEnabled ? (
                  <DemoButton enabled size="lg" variant="brand" />
                ) : (
                  <Button variant="brand" size="lg" asChild>
                    <Link href="/auth/sign-in">
                      Start for free
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            </LandingReveal>
          </section>
        )}
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-heading text-foreground">På&apos;n</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Kanban for people who like lists that move</span>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
