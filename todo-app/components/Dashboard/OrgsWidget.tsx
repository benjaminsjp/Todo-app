import { DashboardWidget } from './DashboardWidget'
import { Building2, ListTodo, Users } from 'lucide-react'
import Link from 'next/link'

type OrgPreview = {
  id: number
  name: string
  slug: string
  role: string
  taskCount: number
  memberCount: number
}

export function OrgsWidget({ orgs }: { orgs: OrgPreview[] }) {
  const preview = orgs.slice(0, 3)

  return (
    <DashboardWidget title="Organizations" href="/org" icon={Building2} iconColor="text-violet-500">
      {preview.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organizations yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {preview.map((org) => (
            <Link
              key={org.id}
              href={`/org/${org.slug}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
            >
              <div className="rounded-lg bg-muted p-2">
                <Building2 className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{org.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{org.role}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1">
                  <ListTodo className="size-3.5" />
                  {org.taskCount}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {org.memberCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardWidget>
  )
}
