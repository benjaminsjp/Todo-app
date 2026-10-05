'use client'

import { useCallback, useEffect, useRef } from 'react'
import { toggleTaskListCheckbox } from '@/lib/tiptapTaskListHtml'

const CHECKBOX_SAVE_DEBOUNCE_MS = 450

type SaveResult = { error: string } | { success: true }

export function useTaskListCheckboxPersistence({
  enabled,
  onSave,
  onRevertDisplay,
}: {
  enabled: boolean
  onSave: (html: string) => Promise<SaveResult>
  /** Called when a save fails so visible HTML matches reverted ref state. */
  onRevertDisplay?: (html: string) => void
}) {
  const htmlRef = useRef('')
  const lastSavedRef = useRef('')
  const checkboxDirtyRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncFromSaved = useCallback((html: string) => {
    htmlRef.current = html
    lastSavedRef.current = html
    checkboxDirtyRef.current = false
  }, [])

  const flushSave = useCallback(async (): Promise<SaveResult | null> => {
    const nextHtml = htmlRef.current
    if (nextHtml === lastSavedRef.current) {
      checkboxDirtyRef.current = false
      return null
    }

    const snapshot = lastSavedRef.current
    const result = await onSave(nextHtml)

    if ('error' in result) {
      checkboxDirtyRef.current = false
      htmlRef.current = snapshot
      onRevertDisplay?.(snapshot)
      return result
    }

    lastSavedRef.current = nextHtml
    checkboxDirtyRef.current = false
    return result
  }, [onSave, onRevertDisplay])

  const scheduleSave = useCallback(() => {
    checkboxDirtyRef.current = true
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      void flushSave()
    }, CHECKBOX_SAVE_DEBOUNCE_MS)
  }, [flushSave])

  const cancelScheduledSave = useCallback(() => {
    if (!saveTimerRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
  }, [])

  const flushScheduledSave = useCallback(async () => {
    cancelScheduledSave()
    return flushSave()
  }, [cancelScheduledSave, flushSave])

  useEffect(() => {
    return () => {
      if (!saveTimerRef.current) return
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
      void flushSave()
    }
  }, [flushSave])

  const handleTaskListClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, setHtml: (html: string) => void) => {
      if (!enabled) return

      const target = e.target as HTMLElement | null
      if (!target) return

      const li = target.closest?.('ul[data-type="taskList"] li') as HTMLLIElement | null
      if (!li) return
      if (target.closest?.('a[href]')) return

      const root = e.currentTarget
      const boxes = Array.from(root.querySelectorAll('ul[data-type="taskList"] input[type="checkbox"]'))
      const input = li.querySelector?.('input[type="checkbox"]') as HTMLInputElement | null
      if (!input) return

      const idx = boxes.indexOf(input)
      if (idx < 0) return

      e.preventDefault()

      const nextHtml = toggleTaskListCheckbox(htmlRef.current, idx)
      if (nextHtml === null) return

      htmlRef.current = nextHtml
      setHtml(nextHtml)
      scheduleSave()
    },
    [enabled, scheduleSave],
  )

  return {
    htmlRef,
    lastSavedRef,
    checkboxDirtyRef,
    syncFromSaved,
    handleTaskListClick,
    flushScheduledSave,
    cancelScheduledSave,
  }
}
