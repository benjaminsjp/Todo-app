import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, tasks, organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ProfileForm } from '@/components/Account/ProfileForm'
import { DeleteAccountButton } from '@/components/Account/DeleteAccountButton'
import { LogoutButton } from '@/components/Account/LogoutButton'
import { ExportDataButton } from '@/components/Account/ExportDataButton'

import { formatDate } from '@/lib/types'
import { ListTodo, CheckCircle, Clock, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const [user, allTasks, memberships] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
    db.query.tasks.findMany({
      where: eq(tasks.createdBy, session.user.id),
      with: { status: true },
    }),
    db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, session.user.id),
    }),
  ])

  if (!user) redirect('/api/auth/sign-in')

  const stats = {
    total:      allTasks.length,
    done:       allTasks.filter((t) => t.status?.label === 'Done').length,
    inProgress: allTasks.filter((t) => t.status?.label === 'In Progress').length,
    orgs:       memberships.length,
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-medium font-heading text-heading-strong">
            My profile
          </h1>
          <LogoutButton />
        </div>

        {/* Profile form */}
        <div className="rounded-2xl border bg-card p-6 mb-6 animate-fade-up animate-once animate-duration-250">
          <h2 className="text-lg font-medium mb-6">Profile information</h2>
          <ProfileForm
            displayName={user.displayName ?? ''}
            email={user.email}
            avatarUrl={user.avatarUrl ?? ''}
            createdAt={user.createdAt}
          />
        </div>

        {/* Data */}
        <div className="rounded-2xl border bg-card p-6 mb-6 animate-fade-up animate-once animate-duration-250 animate-delay-100">
          <h2 className="text-lg font-medium mb-2">Your data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Download a copy of all your data stored in På'n.
          </p>
          <ExportDataButton />
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-destructive/30 bg-card p-6 animate-fade-up animate-once animate-duration-250 animate-delay-150">
          <h2 className="text-lg font-medium text-destructive mb-2">Danger zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}