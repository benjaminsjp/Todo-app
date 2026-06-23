import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { taskGroups, organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CreateTaskForm } from '@/components/CreateTask/CreateTaskForm'
import { notFound } from 'next/navigation'
import { getOrgAssigneeOptions } from '@/lib/db/queries'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  })

  if (!org) notFound()

  const [groups, assigneeOptions] = await Promise.all([
    db.select({
      id:    taskGroups.id,
      title: taskGroups.title,
    })
    .from(taskGroups)
    .where(eq(taskGroups.orgId, org.id)),
    getOrgAssigneeOptions(org.id),
  ])

  return <CreateTaskForm taskGroups={groups} assigneeOptions={assigneeOptions} orgId={org.id} orgSlug={slug} />
}