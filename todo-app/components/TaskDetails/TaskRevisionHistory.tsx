'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getTaskRevisions, rollbackTaskToRevision } from '@/lib/actions/revisions'
import { toast } from 'sonner'
import { History, RotateCcw } from 'lucide-react'

type Revision = {
  id: number
  action: string
  createdAt: Date | null
  before: any
  after: any
  user?: { displayName: string | null; email: string; avatarUrl: string | null } | null
}

function formatWhen(d: Date | null) {
  if (!d) return ''
  return new Date(d).toLocaleString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function TaskRevisionHistory({ taskId }: { taskId: number }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revisions, setRevisions] = useState<Revision[]>([])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getTaskRevisions(taskId).then((res) => {
      setLoading(false)
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      setRevisions(res.revisions as any)
    })
  }, [open, taskId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" title="Revision history">
          <History className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Revision history</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No revisions yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {revisions.map((r) => {
                const who = r.user?.displayName ?? r.user?.email ?? 'Unknown'
                return (
                  <div key={r.id} className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
                    <div className="flex flex-col gap-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.action}</span>
                        <span className="text-xs text-muted-foreground">#{r.id}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{formatWhen(r.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">by {who}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const res = await rollbackTaskToRevision(taskId, r.id)
                        if ('error' in res) {
                          toast.error(res.error)
                          return
                        }
                        toast.success('Rolled back')
                        setOpen(false)
                      }}
                    >
                      <RotateCcw className="size-4" /> Rollback
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

