import { DashboardWidget } from './DashboardWidget'
import { type LucideIcon } from 'lucide-react'

interface PlaceholderWidgetProps {
  title: string
  icon: LucideIcon
  description: string
  className?: string
  href?: string
}

export function PlaceholderWidget({ title, icon, description, className, href }: PlaceholderWidgetProps) {
  return (
    <DashboardWidget title={title} icon={icon} className={className} href={href}>
      <div className="h-full flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="rounded-full bg-muted p-4">
          {/* icon rendered via DashboardWidget header */}
        </div>
        <p className="text-sm text-muted-foreground max-w-48">{description}</p>
        <span className="text-xs border rounded-full px-3 py-1 text-muted-foreground">
          {href ? 'Åpne kalender' : 'Kommer snart'}
        </span>
      </div>
    </DashboardWidget>
  )
}