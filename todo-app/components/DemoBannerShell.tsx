'use client'

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'
import { DemoBanner } from './DemoBanner'

type DemoBannerContextValue = {
  visible: boolean
  dismiss: () => void
}

const DemoBannerContext = createContext<DemoBannerContextValue>({
  visible: false,
  dismiss: () => {},
})

export function useDemoBanner() {
  return useContext(DemoBannerContext)
}

export function DemoBannerShell({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  const [dismissed, setDismissed] = useState(false)
  const visible = enabled && !dismissed

  return (
    <DemoBannerContext.Provider
      value={{ visible, dismiss: () => setDismissed(true) }}
    >
      <div
        className="flex min-h-svh w-full flex-col"
        data-demo-banner={visible || undefined}
        style={visible ? ({ '--demo-banner-height': '3rem' } as CSSProperties) : undefined}
      >
        {visible && (
          <>
            <DemoBanner />
            <div className="h-(--demo-banner-height) shrink-0" aria-hidden />
          </>
        )}
        {children}
      </div>
    </DemoBannerContext.Provider>
  )
}
