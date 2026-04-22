// app/tasks/create-task/page.tsx
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, taskGroups } from '@/lib/db/schema'
import { CreateTaskForm } from '@/components/CreateTask/CreateTaskForm'
import { eq } from 'drizzle-orm'

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/login')

  const { orgId: orgIdParam } = await searchParams
  const orgId = orgIdParam ? Number(orgIdParam) : undefined

  const groups = await db
    .select({ id: taskGroups.id, title: taskGroups.title })
    .from(taskGroups)
    .where(
      orgId
        ? eq(taskGroups.orgId, orgId)         // only this org's groups
        : eq(taskGroups.createdBy, session.user.id) // personal tasks fallback
    )

  const org = orgId
    ? await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      })
    : null

  return (
    <CreateTaskForm taskGroups={groups} orgId={orgId} orgSlug={org?.slug} />
  )
}
