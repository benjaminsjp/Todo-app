// app/tasks/create-task/page.tsx
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, taskGroups } from '@/lib/db/schema'
import { CreateTaskForm } from '@/components/CreateTask/CreateTaskForm'
import { eq } from 'drizzle-orm'
import { getOrgAssigneeOptions, getPersonalAssigneeOptions } from '@/lib/db/queries'

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { orgId: orgIdParam } = await searchParams
  const orgId = orgIdParam ? Number(orgIdParam) : undefined

  const [groups, org, assigneeOptions] = await Promise.all([
    db
      .select({ id: taskGroups.id, title: taskGroups.title })
      .from(taskGroups)
      .where(
        orgId
          ? eq(taskGroups.orgId, orgId)
          : eq(taskGroups.createdBy, session.user.id)
      ),
    orgId
      ? db.query.organizations.findFirst({
          where: eq(organizations.id, orgId),
        })
      : null,
    orgId ? getOrgAssigneeOptions(orgId) : getPersonalAssigneeOptions(session.user.id),
  ])

  return (
    <CreateTaskForm taskGroups={groups} assigneeOptions={assigneeOptions} orgId={orgId} orgSlug={org?.slug} />
  )
}
