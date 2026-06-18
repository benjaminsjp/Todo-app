// app/org/[slug]/page.tsx
import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getTasksForOrg, getTaskGroupsForOrg, getStatusesForOrg } from '@/lib/db/queries'
import { KanbanBoard } from '@/components/Kanban/KanbanBoard'
import { CreateTaskButton } from '@/components/CreateTask/CreateTaskButton'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: "Organisasjon | På'n" }
export const dynamic = 'force-dynamic'

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
    const { data: session } = await auth.getSession()
    if (!session?.user) redirect('/auth/sign-in')

    const { slug } = await params

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.slug, slug),
    })
    if (!org) redirect('/tasks')

    const membership = await db.query.organizationMembers.findFirst({
        where: and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, session.user.id)
        ),
    })
    if (!membership) redirect('/tasks')

    const [tasks, taskGroups, statuses] = await Promise.all([
    getTasksForOrg(org.id),
    getTaskGroupsForOrg(org.id),
    getStatusesForOrg(org.id),
    ])

    return (
        <div className="flex flex-1 flex-col">
        <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
            
            <div className='mb-6 gap-4 flex items-center'>
                    <CreateTaskButton orgId={org.id} />
                    <Button variant="secondary" asChild>
                        <Link href={`/org/${org.slug}/settings`}>
                        <Settings className="size-4" />
                        {['owner', 'admin'].includes(membership.role) ? 'Administrer organisasjon' : 'Organisasjonsinnstillinger'}
                        </Link>
                    </Button>
                </div>
            <div className="flex items-center mb-8 gap-3">
                <h1 className="text-5xl font-medium font-heading text-heading-strong">
                    {org.name}
                </h1>
                <div className='ml-auto'>
                    
                </div>
            </div>
            <KanbanBoard
              tasks={tasks}
              taskGroups={taskGroups}
              statuses={statuses}
              orgSlug={org.slug}
              orgId={org.id}
              userId={session.user.id}
            />
        </div>
        </div>
    )
}