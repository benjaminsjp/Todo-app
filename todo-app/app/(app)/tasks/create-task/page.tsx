import { Suspense } from 'react'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { organizations, taskGroups } from '@/lib/db/schema'
import { CreateTaskForm } from '@/components/CreateTask/CreateTaskForm'
import { TaskPageSkeleton } from '@/components/TaskDetails/TaskPageSkeleton'
import { eq } from 'drizzle-orm'
import {
  getOrgAssigneeOptions,
  getPersonalAssigneeOptions,
  getStatusesForOrg,
  getStatusesForUser,
} from '@/lib/db/queries'

export default function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string; statusId?: string }>
}) {
  return (
    <Suspense fallback={<TaskPageSkeleton />}>
      <CreateTaskContent searchParams={searchParams} />
    </Suspense>
  )
}

async function CreateTaskContent({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string; statusId?: string }>
}) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { orgId: orgIdParam, statusId: statusIdParam } = await searchParams
  const orgId = orgIdParam ? Number(orgIdParam) : undefined
  const initialStatusId = statusIdParam ? Number(statusIdParam) : null

  const [groups, org, assigneeOptions, statuses] = await Promise.all([
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
          columns: { slug: true },
        })
      : null,
    orgId ? getOrgAssigneeOptions(orgId) : getPersonalAssigneeOptions(session.user.id),
    orgId ? getStatusesForOrg(orgId) : getStatusesForUser(session.user.id),
  ])

  const validInitialStatusId =
    initialStatusId && statuses.some((status) => status.id === initialStatusId)
      ? initialStatusId
      : null

  return (
    <CreateTaskForm
      taskGroups={groups}
      assigneeOptions={assigneeOptions}
      statuses={statuses}
      initialStatusId={validInitialStatusId}
      orgId={orgId}
      orgSlug={org?.slug}
    />
  )
}
