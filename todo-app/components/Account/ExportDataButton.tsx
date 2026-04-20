'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ExportDataButton() {
  const [isPending, setIsPending] = useState(false)

  const handleExport = async () => {
    setIsPending(true)

    try {
      const res = await fetch('/api/export-data')
      if (!res.ok) { toast.error('Export failed'); return }

      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const link     = document.createElement('a')
      link.href      = url
      link.download  = `paan-data-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Data exported!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      {isPending
        ? <><Loader2 className="size-4 animate-spin" /> Exporting...</>
        : <><Download className="size-4" /> Download my data</>
      }
    </Button>
  )
}