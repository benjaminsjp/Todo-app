// components/CreateOrg/CreateOrgButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateOrgModal } from './CreateOrgModal'

export function CreateOrgButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Ny organisasjon
      </Button>
      <CreateOrgModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}