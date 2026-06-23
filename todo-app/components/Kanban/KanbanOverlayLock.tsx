'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type KanbanOverlayLockContextValue = {
  acquire: () => () => void
  isLocked: boolean
}

const KanbanOverlayLockContext = createContext<KanbanOverlayLockContextValue>({
  acquire: () => () => {},
  isLocked: false,
})

export function KanbanOverlayLockProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [lockCount, setLockCount] = useState(0)

  const acquire = useCallback(() => {
    setLockCount((count) => count + 1)
    let released = false
    return () => {
      if (released) return
      released = true
      setLockCount((count) => Math.max(0, count - 1))
    }
  }, [])

  const value = useMemo(
    () => ({ acquire, isLocked: lockCount > 0 }),
    [acquire, lockCount],
  )

  return (
    <KanbanOverlayLockContext.Provider value={value}>
      {children}
    </KanbanOverlayLockContext.Provider>
  )
}

export function useKanbanOverlayLocked() {
  return useContext(KanbanOverlayLockContext).isLocked
}

export function useKanbanOverlayLock(open: boolean) {
  const { acquire } = useContext(KanbanOverlayLockContext)

  useEffect(() => {
    if (!open) return
    const release = acquire()
    return () => {
      window.setTimeout(release, 200)
    }
  }, [open, acquire])
}
