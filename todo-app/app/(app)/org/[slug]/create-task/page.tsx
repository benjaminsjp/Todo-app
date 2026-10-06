import { Suspense } from 'react'
import { auth } from '@/lib/auth/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { taskGroups, organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CreateTaskForm } from '@/components/CreateTask/CreateTaskForm'
import { SetBreadcrumbLabel } from '@/components/Breadcrumbs/SetBreadcrumbLabel'
import { TaskPageSkeleton } from '@/components/TaskDetails/TaskPageSkeleton'
import { getOrgAssigneeOptions, getStatusesForOrg } from '@/lib/db/queries'

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ statusId?: string }>
}) {
  return (
    <Suspense fallback={<TaskPageSkeleton />}>
      <CreateOrgTaskContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function CreateOrgTaskContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ statusId?: string }>
}) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params
  const { statusId: statusIdParam } = await searchParams
  const initialStatusId = statusIdParam ? Number(statusIdParam) : null

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: { id: true, name: true, slug: true },
  })

  if (!org) notFound()

  const [groups, assigneeOptions, statuses] = await Promise.all([
    db.select({
      id:    taskGroups.id,
      title: taskGroups.title,
    })
    .from(taskGroups)
    .where(eq(taskGroups.orgId, org.id)),
    getOrgAssigneeOptions(org.id),
    getStatusesForOrg(org.id),
  ])

  const validInitialStatusId =
    initialStatusId && statuses.some((status) => status.id === initialStatusId)
      ? initialStatusId
      : null

  return (
    <>
      <SetBreadcrumbLabel segment={slug} label={org.name} />
      <CreateTaskForm
        taskGroups={groups}
        assigneeOptions={assigneeOptions}
        statuses={statuses}
        initialStatusId={validInitialStatusId}
        orgId={org.id}
        orgSlug={slug}
      />
    </>
  )
}
