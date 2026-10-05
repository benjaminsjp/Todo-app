import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AuthScreen({
  title,
  description,
  children,
  footer,
  className,
}: {
  title:        string
  description?: string
  children:     ReactNode
  footer?:      ReactNode
  className?:   string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className={cn('w-full max-w-[420px] space-y-6', className)}>
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-heading font-medium tracking-tight text-heading-strong">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </header>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>

        {footer}
      </div>
    </div>
  )
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      {message}
    </div>
  )
}

export function AuthSuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function AuthFooterLinks({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export function AuthTextButton({
  children,
  onClick,
  className,
}: {
  children:  ReactNode
  onClick:   () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'font-medium text-foreground underline-offset-4 hover:underline',
        className,
      )}
    >
      {children}
    </button>
  )
}
