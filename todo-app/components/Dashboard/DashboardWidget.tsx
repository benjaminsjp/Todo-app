import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'

interface DashboardWidgetProps {
  title: string
  href?: string
  icon: LucideIcon
  iconColor?: string
  children: React.ReactNode
  className?: string
}

export function DashboardWidget({
  title,
  href,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  children,
  className = '',
}: DashboardWidgetProps) {
  return (
    <div className={`rounded-2xl border bg-card flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${iconColor}`} />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {href && (
          <Button 
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={href}>
                View all <ArrowRight className="size-3" />
            </Link>
          </Button>
        )}
      </div>
      <div className="p-6 flex-1">{children}</div>
    </div>
  )
}