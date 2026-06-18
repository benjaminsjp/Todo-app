import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, tasks, organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ProfileForm } from '@/components/Account/ProfileForm'
import { DeleteAccountButton } from '@/components/Account/DeleteAccountButton'
import { LogoutButton } from '@/components/Account/LogoutButton'
import { ExportDataButton } from '@/components/Account/ExportDataButton'

import { isDemoUser } from '@/lib/demo/config'
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

  if (!user) redirect('/auth/sign-in')

  const isDemo = isDemoUser(session.user)

  const stats = {
    total:      allTasks.length,
    done:       allTasks.filter((t) => t.status?.order === 2).length,
    inProgress: allTasks.filter((t) => t.status?.order === 1).length,
    orgs:       memberships.length,
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-medium font-heading text-heading-strong">
            Min profil
          </h1>
          <LogoutButton />
        </div>

        {/* Profile form */}
        <div className="rounded-2xl border bg-card p-6 mb-6 animate-fade-up animate-once animate-duration-250">
          <h2 className="text-lg font-medium mb-6">Profilinformasjon</h2>
          <ProfileForm
            displayName={user.displayName ?? ''}
            email={user.email}
            avatarUrl={user.avatarUrl ?? ''}
            createdAt={user.createdAt}
          />
        </div>

        {/* Data */}
        <div className="rounded-2xl border bg-card p-6 mb-6 animate-fade-up animate-once animate-duration-250 animate-delay-100">
          <h2 className="text-lg font-medium mb-2">Dine data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Last ned en kopi av alle dataene dine lagret i På'n.
          </p>
          <ExportDataButton />
        </div>

        {/* Danger zone */}
        {!isDemo && (
        <div className="rounded-2xl border border-destructive/30 bg-card p-6 animate-fade-up animate-once animate-duration-250 animate-delay-150">
          <h2 className="text-lg font-medium text-destructive mb-2">Faresone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Slett kontoen din og alle tilknyttede data permanent. Dette kan ikke angres.
          </p>
          <DeleteAccountButton />
        </div>
        )}
      </div>
    </div>
  )
}