'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

const TITLE_FIELD_CLASS =
  'text-5xl font-medium text-center sm:text-left font-heading bg-transparent border-none outline-none placeholder:text-muted-foreground text-heading-strong mb-6 w-full resize-none overflow-hidden leading-snug field-sizing-content min-h-[1.2em]'

function useAutoGrowTextarea(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value?: string,
) {
  const adjust = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [ref])

  React.useLayoutEffect(() => {
    adjust()
  }, [adjust, value])

  return adjust
}

type TaskTitleFieldProps = {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  required?: boolean
  /** Ctrl/Cmd+Enter shortcut (save/create task). */
  onModEnter?: () => void
  /** Escape shortcut (cancel edit). */
  onEscape?: () => void
} & (
  | {
      name: string
      defaultValue?: string
      value?: never
      onChange?: never
    }
  | {
      name?: string
      value: string
      onChange: (value: string) => void
    }
)

function isModEnter(event: React.KeyboardEvent) {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey)
}

export function TaskTitleField(props: TaskTitleFieldProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const value = 'value' in props ? props.value : undefined
  const adjust = useAutoGrowTextarea(ref, value)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape' && props.onEscape) {
      event.preventDefault()
      props.onEscape()
      return
    }
    if (!props.onModEnter || !isModEnter(event)) return
    event.preventDefault()
    props.onModEnter()
  }

  const shared = {
    ref,
    rows: 1 as const,
    className: cn(TITLE_FIELD_CLASS, props.className),
    placeholder: props.placeholder ?? 'Oppgavetittel...',
    autoFocus: props.autoFocus,
    required: props.required,
    onInput: adjust,
    onKeyDown: handleKeyDown,
  }

  if ('value' in props && props.onChange) {
    return (
      <textarea
        {...shared}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    )
  }

  return (
    <textarea
      {...shared}
      name={props.name}
      defaultValue={props.defaultValue}
    />
  )
}
