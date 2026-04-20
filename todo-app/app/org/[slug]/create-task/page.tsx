import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { taskGroups, organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CreateTaskForm } from '@/components/CreateTask/CreateTaskForm'
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const { slug } = await params

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  })

  if (!org) notFound()

  const groups = await db.select({
    id:    taskGroups.id,
    title: taskGroups.title,
  })
  .from(taskGroups)
  .where(eq(taskGroups.orgId, org.id))

  return <CreateTaskForm taskGroups={groups} orgId={org.id} orgSlug={slug} />
}