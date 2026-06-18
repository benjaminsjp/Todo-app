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
        Personlige oppgaver ligger under{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/tasks</code> med dine statuser
        og grupper.
      </>
    ),
  },
  {
    icon: <Users />,
    children: (
      <>
        Org-tavler ligger under{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/org/ditt-team</code> med invitasjoner
        og medlemsroller.
      </>
    ),
  },
  {
    icon: <GripVertical />,
    children: (
      <>
        Dra kort på tavlen <em>eller</em> dra oppgaver mellom grupper i sidepanelet — begge oppdaterer
        samme oppgave.
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
    title: 'Din egen tavle, klar med en gang',
    body: 'Hver konto får en personlig Kanban med kolonnene Å gjøre, Pågår og Ferdig. Dra kort mellom statuser, sett frister og legg til rik tekst — ingen oppsettsveiviser.',
    detail: 'Statuser har ikoner og farger du kan tilpasse senere.',
  },
  {
    step: '02',
    title: 'Sidegrupper holder relatert arbeid samlet',
    body: 'Oppgaver trenger ikke ligge i en flat liste. Legg dem i fargede grupper som «Kom i gang» eller «Sprint 12», og dra mellom grupper fra sidepanelet uten å miste kontekst.',
    detail: 'Ugrupperte oppgaver vises øverst til du organiserer dem.',
  },
  {
    step: '03',
    title: 'Organisasjoner når arbeidet deles',
    body: 'Opprett et arbeidsområde for teamet, inviter medlemmer på e-post, og bytt mellom Personlig og org-visning fra sidepanelet. Hver org får sin egen tavle, statuser og oppgavegrupper.',
    detail: 'Roller dekker eiere, administratorer, medlemmer og lesere.',
  },
  {
    step: '04',
    title: 'Sanntidsoppdateringer mens dere samarbeider',
    body: 'Org-tavler synkroniseres i sanntid via SSE. Se når noen andre redigerer en oppgave — en rød tilstedeværelsesprikk betyr «ikke rør», grønn betyr at de bare ser på.',
    detail: 'Kommentarer og revisjonshistorikk holder tråden på hvert kort.',
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
            <a href="#how-it-works" className="transition-colors hover:text-foreground hover:translate-y-px">Slik fungerer det</a>
            <a href="#preview" className="transition-colors hover:text-foreground hover:translate-y-px">I appen</a>
          </nav>
          {isAuthenticated ? (
            <LandingSessionActions isDemoSession={isDemoSession} />
          ) : (
            <Button variant="secondary" size="sm" asChild>
              <Link href="/auth/sign-in">Logg inn</Link>
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
              title="Det du faktisk gjør i På'n"
              description="Ikke enda en abstrakt «produktivitetspakke». Her er løkken de fleste følger på dag én."
              titleClassName="font-heading text-3xl font-medium text-heading-strong md:text-4xl"
              descriptionClassName="mt-4 text-lg text-muted-foreground"
            />

            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              {workflow.map((item, index) => (
                <LandingReveal key={item.step} delay={index * 120} motion="fade">
                  <article className="landing-card-lift relative h-full rounded-2xl border bg-card p-8 pl-10 hover:border-brand/35 hover:shadow-lg hover:shadow-brand/10">
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
                  title="Personlig i dag, delt i morgen"
                  description="Start på Personlig med egne oppgaver og grupper. Når et prosjekt trenger flere folk, opprett en organisasjon — grensesnittet er det samme, men tavlen tilhører hele teamet."
                  titleClassName="font-heading text-3xl font-medium text-heading-strong"
                  descriptionClassName="mt-4 text-muted-foreground leading-relaxed"
                />

                <LandingCascadeList items={personalHighlights} className="mt-8" />
              </div>

              <LandingReveal delay={120} motion="fade">
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
                title="Se det med egne klikk"
                description={
                  demoEnabled
                    ? 'Demoen laster en personlig tavle og en Acme Team-org med eksempeloppgaver allerede på plass.'
                    : 'Opprett en konto, så er tavlen din klar med standardkolonner på sekunder.'
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
                      Kom i gang gratis
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
            <span className="hidden sm:inline">Kanban for folk som liker lister som beveger seg</span>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
