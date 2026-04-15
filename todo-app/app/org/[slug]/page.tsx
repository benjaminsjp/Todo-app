// app/org/[slug]/page.tsx
import { Metadata } from 'next'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getTasksForOrg, getTaskGroupsForOrg } from '@/lib/db/queries'
import { KanbanBoard } from '@/components/Kanban/KanbanBoard'
import { CreateTaskButton } from '@/components/CreateTask/CreateTaskButton'

export const metadata: Metadata = { title: "Org | På'n" }
export const dynamic = 'force-dynamic'

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
    const { data: session } = await auth.getSession()
    if (!session?.user) redirect('/auth/sign-in')

    const { slug } = await params

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.slug, slug),
    })
    console.log('Org funnet:', org)
    if (!org) redirect('/tasks')

    // Verify user is a member
    const membership = await db.query.organizationMembers.findFirst({
        where: and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, session.user.id)
        ),
    })
    console.log('membership:', membership)
    console.log('userId:', session.user.id)
    if (!membership) redirect('/tasks')

    const [tasks, taskGroups] = await Promise.all([
        getTasksForOrg(org.id),
        getTaskGroupsForOrg(org.id),
    ])

    return (
        <div className="flex flex-1 flex-col">
        <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
            <div className="flex items-center justify-between mb-8">
            <h1 className="text-5xl font-medium font-heading text-heading-strong">
                {org.name}
            </h1>
            <CreateTaskButton orgId={org.id} />
            </div>
            <KanbanBoard tasks={tasks} taskGroups={taskGroups} orgSlug={org.slug} orgId={org.id} />
        </div>
        </div>
    )
}