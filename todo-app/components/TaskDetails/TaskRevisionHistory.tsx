'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getTaskRevisions, rollbackTaskToRevision } from '@/lib/actions/revisions'
import { toast } from 'sonner'
import { History, RotateCcw, ChevronRight } from 'lucide-react'
import { type Status } from '@/lib/types'
import { formatTaskDateTime } from '@/lib/taskSchedule'

import { useRouter } from 'next/navigation'

import * as Diff from 'diff'

type Revision = {
  id:        number
  action:    string
  createdAt: Date | null
  before:    any
  after:     any
  user?:     { displayName: string | null; email: string; avatarUrl: string | null } | null
}

const FIELD_LABELS: Record<string, string> = {
  title:       'Tittel',
  description: 'Beskrivelse',
  startAt:     'Start',
  endAt:       'Frist',
  deadlinePriority: 'Frist-prioritet',
  deadline:    'Frist',
  statusId:    'Status',
  groupId:     'Gruppe',
}

const ACTION_LABELS: Record<string, string> = {
  update:   'Oppdatering',
  status:   'Status',
  group:    'Gruppe',
  rollback: 'Tilbakestilling',
}


function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? ''
}

function formatValue(key: string, value: any, statuses: Status[]): string {
  if (value === null || value === undefined) return '–'
  if (key === 'description') return stripHtml(String(value))
  if (key === 'startAt' || key === 'endAt' || key === 'deadline') {
    return formatTaskDateTime(value)
  }
  if (key === 'deadlinePriority') {
    return value ? 'På' : 'Av'
  }
  if (key === 'statusId') {
    const match = statuses.find((s) => s.id === Number(value))
    return match?.label ?? `Status #${value}`
  }
  return String(value)
}

function TextDiff({ before, after }: { before: string; after: string }) {
  const changes = Diff.diffWords(before, after)

  return (
    <span className='prose prose-sm'>
      {changes.map((part, i) => {
        if (part.added) {
          return (
            <mark key={i} className="bg-revision-added-background text-black rounded px-1.5 not-italic">
              {part.value}
            </mark>
          )
        }
        if (part.removed) {
          return (
            <mark key={i} className=" text-black rounded px-1.5">
              {part.value}
            </mark>
          )
        }
        return <span key={i} className="text-muted-foreground">{part.value}</span>
      })}
    </span>
  )
}

function RevisionDiff({
  beforeData,
  afterData,
  statuses,
}: {
  beforeData: any
  afterData:  any
  statuses:   Status[]
}) {
  const changes = Object.keys(FIELD_LABELS).filter((key) => {
    const b = beforeData?.[key]
    const a = afterData?.[key]
    return b !== a && !(b == null && a == null)
  })

  if (changes.length === 0) return (
    <p className="text-xs text-muted-foreground mt-2 rounded-lg bg-card p-3">Ingen sporede endringer funnet.</p>
  )

  return (
    <div className="flex flex-col gap-2 mt-2">
      {changes.map((key) => {
        const label     = FIELD_LABELS[key]
        const beforeVal = formatValue(key, beforeData?.[key], statuses)
        const afterVal  = formatValue(key, afterData?.[key],  statuses)

        // Statusfelt og korte verdier – vis som før/etter
        const isShortField = key !== 'description' && key !== 'title'

        return (
          <div key={key} className="flex flex-col gap-1.5 text-xs rounded-lg bg-card p-3">
            <span className="font-medium text-muted-foreground">{label}</span>

            {isShortField ? (
              // Kort felt – vis gammel → ny
              <div className="flex items-center gap-2 flex-wrap">
                {beforeVal !== '–' && (
                  <span className="line-through text-destructive/80">{beforeVal}</span>
                )}
                {beforeVal !== '–' && afterVal !== '–' && (
                  <span className="text-muted-foreground">→</span>
                )}
                {afterVal !== '–' && (
                  <span className="text-green-600 dark:text-green-400">{afterVal}</span>
                )}
                {afterVal === '–' && beforeVal !== '–' && (
                  <span className="text-muted-foreground italic">Fjernet</span>
                )}
              </div>
            ) : (
              // Langt felt – inline word-diff
              <div className="leading-relaxed">
                <TextDiff before={beforeVal === '–' ? '' : beforeVal} after={afterVal === '–' ? '' : afterVal} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


function formatWhen(d: Date | null) {
  if (!d) return ''
  return new Date(d).toLocaleString('no-NO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function TaskRevisionHistory({
  taskId,
  statuses = [],
  canEdit = true,
}: {
  taskId:   number
  statuses?: Status[]
  canEdit?: boolean
}) {
  const [open,      setOpen]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [revisions, setRevisions] = useState<Revision[]>([])
  const router = useRouter()


  useEffect(() => {
    if (!open) return
    setLoading(true)
    getTaskRevisions(taskId).then((res) => {
      setLoading(false)
      if ('error' in res) { toast.error(res.error); return }
      const revs = res.revisions as any
      const descRev = revs.find((r: any) => r.before?.description || r.after?.description)
      if (descRev) console.log('description revision:', JSON.stringify(descRev, null, 2))
      setRevisions(revs)
    })
  }, [open, taskId])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Revisjonshistorikk">
          <History className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col bg-surface-1">
        <SheetHeader className='border-b'>
          <SheetTitle>Revisjonshistorikk</SheetTitle>
          <SheetDescription>
            Se og administrer revisjonene dine.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-6 overflow-hidden">
          {loading ? (
            <p className="text-sm text-muted-foreground">Laster…</p>
          ) : revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen revisjoner ennå.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {revisions.map((r) => {
                const who     = r.user?.displayName ?? r.user?.email ?? 'Ukjent'
                const hasDiff = r.before || r.after

                return (
                  <Collapsible key={r.id}>
                    <div className="rounded-xl bg-secondary p-4 flex flex-col gap-1">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{ACTION_LABELS[r.action] ?? r.action}</span>
                            <span className="text-xs text-muted-foreground">#{r.id}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatWhen(r.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">av {who}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {hasDiff && (
                            <CollapsibleTrigger asChild>
                              <Button variant="secondary" size="icon-sm" className="group">
                                <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
                              </Button>
                            </CollapsibleTrigger>
                          )}
                          {canEdit && (
                          <Button
                            size="icon-sm"
                            variant="default"
                            onClick={async () => {
                              const res = await rollbackTaskToRevision(taskId, r.id)
                              if ('error' in res) { toast.error(res.error); return }
                              toast.success('Rullet tilbake')
                              router.refresh()
                              setOpen(false)
                            }}
                            
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                          )}
                        </div>
                      </div>

                      {hasDiff && (
                        <CollapsibleContent>
                          <RevisionDiff
                            beforeData={r.before}
                            afterData={r.after}
                            statuses={statuses}
                          />
                        </CollapsibleContent>
                      )}
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}