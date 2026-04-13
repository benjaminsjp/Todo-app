'use server'

import { db } from '@/lib/db'
import { organizations, organizationMembers, statuses } from '@/lib/db/schema'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export async function createOrganization(formData: FormData) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Navn er påkrevd' }

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const [org] = await db.insert(organizations).values({ name, slug }).returning()

  // Legg til bruker som owner
  await db.insert(organizationMembers).values({
    orgId:  org.id,
    userId: session.user.id,
    role:   'owner',
  })

  // Seed standard statuser
  await db.insert(statuses).values([
    { label: 'Todo',        color: 'gray',  order: 0, orgId: org.id },
    { label: 'In Progress', color: 'blue',  order: 1, orgId: org.id },
    { label: 'Done',        color: 'green', order: 2, orgId: org.id },
  ])

  redirect(`/org/${org.slug}`)
}