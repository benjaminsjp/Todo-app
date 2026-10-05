'use client'

import { type RefObject, useEffect } from 'react'

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  '[role="button"]',
  '[role="menuitem"]',
  '[data-no-pan]',
  '[data-slot="scroll-area-scrollbar"]',
  '[data-slot="scroll-area-thumb"]',
].join(',')

const PAN_THRESHOLD_PX = 4

/**
 * Click-and-drag horizontal panning for a Radix ScrollArea root.
 * Skips interactive targets (buttons, sortable cards, etc.) so dnd-kit still works.
 */
export function useDragScroll(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const root = rootRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    if (!viewport) return

    let pointerId: number | null = null
    let startX = 0
    let startScrollLeft = 0
    let isPanning = false
    let didPan = false

    const clearTextSelection = () => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) selection.removeAllRanges()
    }

    const stopPan = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return

      if (isPanning) {
        viewport.releasePointerCapture(event.pointerId)
        viewport.classList.remove('cursor-grabbing')
        viewport.classList.add('cursor-grab')
        clearTextSelection()
      }

      pointerId = null
      isPanning = false

      // Suppress the click that follows a pan so empty-area clicks stay intentional.
      if (didPan) {
        const suppressClick = (clickEvent: MouseEvent) => {
          clickEvent.preventDefault()
          clickEvent.stopPropagation()
          viewport.removeEventListener('click', suppressClick, true)
        }
        viewport.addEventListener('click', suppressClick, true)
        didPan = false
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (!(event.target instanceof Element)) return
      if (event.target.closest(INTERACTIVE_SELECTOR)) return

      pointerId = event.pointerId
      startX = event.clientX
      startScrollLeft = viewport.scrollLeft
      isPanning = false
      didPan = false
    }

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return

      const deltaX = event.clientX - startX

      if (!isPanning) {
        if (Math.abs(deltaX) < PAN_THRESHOLD_PX) return
        isPanning = true
        didPan = true
        clearTextSelection()
        viewport.setPointerCapture(event.pointerId)
        viewport.classList.add('cursor-grabbing')
        viewport.classList.remove('cursor-grab')
      }

      event.preventDefault()
      clearTextSelection()
      viewport.scrollLeft = startScrollLeft - deltaX
    }

    const onSelectStart = (event: Event) => {
      // Block native text selection while a pan gesture is in progress.
      if (pointerId !== null) {
        event.preventDefault()
        clearTextSelection()
      }
    }

    viewport.classList.add('cursor-grab', 'select-none')
    viewport.addEventListener('pointerdown', onPointerDown)
    viewport.addEventListener('pointermove', onPointerMove)
    viewport.addEventListener('pointerup', stopPan)
    viewport.addEventListener('pointercancel', stopPan)
    viewport.addEventListener('selectstart', onSelectStart)

    return () => {
      viewport.classList.remove('cursor-grab', 'cursor-grabbing', 'select-none')
      viewport.removeEventListener('pointerdown', onPointerDown)
      viewport.removeEventListener('pointermove', onPointerMove)
      viewport.removeEventListener('pointerup', stopPan)
      viewport.removeEventListener('pointercancel', stopPan)
      viewport.removeEventListener('selectstart', onSelectStart)
    }
  }, [rootRef, enabled])
}
