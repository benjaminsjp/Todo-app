import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CreateOrgButton } from '@/components/CreateOrg/CreateOrgButton'
import { Building2, Users, ListTodo } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: "Organisasjoner | På'n" }

const ROLE_LABELS: Record<string, string> = {
  owner:  'Eier',
  admin:  'Admin',
  member: 'Medlem',
  viewer: 'Leser',
}

export default async function Page() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, session.user.id),
    with: {
      org: {
        with: {
          members: true,
          tasks:   true,
        },
      },
    },
  })

  const orgs = memberships.map((m) => ({
    ...m.org,
    role: m.role,
  }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-medium font-heading text-heading-strong">
              Organisasjoner
            </h1>
            <p className="text-muted-foreground mt-2">
              Administrer organisasjonene dine og samarbeid med andre.
            </p>
          </div>
        </div>

        {orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
            <div className="rounded-full bg-muted p-6">
              <Building2 className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium">Ingen organisasjoner ennå</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Opprett en organisasjon for å samarbeide med teamet ditt om oppgaver og prosjekter.
            </p>
            <CreateOrgButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orgs.map((org) => (
              <Link key={org.id} href={`/org/${org.slug}`}>
                <div className="rounded-2xl border bg-card p-6 flex flex-col gap-4 hover:shadow-md hover:border-foreground/20 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-muted p-3">
                      <Building2 className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold truncate">{org.name}</h2>
                      <p className="text-xs text-muted-foreground">{ROLE_LABELS[org.role] ?? org.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ListTodo className="size-4" />
                      {org.tasks.length} {org.tasks.length === 1 ? 'oppgave' : 'oppgaver'}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="size-4" />
                      {org.members.length} {org.members.length === 1 ? 'medlem' : 'medlemmer'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <CreateOrgButton />
          </div>
        )}
      </div>
    </div>
  )
}
