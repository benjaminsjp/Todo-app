import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/server'
import { getOrgListForUser } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

type LegacyCalendarPageProps = {
  searchParams: Promise<{
    org?: string
    filter?: string
    group?: string
    view?: string
    week?: string
    month?: string
  }>
}

export default async function LegacyCalendarRedirect({ searchParams }: LegacyCalendarPageProps) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  const params = await searchParams
  const orgs = await getOrgListForUser(session.user.id)

  if (orgs.length === 0) redirect('/org')

  const targetOrg = orgs.find((org) => org.slug === params.org) ?? orgs[0]

  const next = new URLSearchParams()
  for (const key of ['filter', 'group', 'view', 'week', 'month'] as const) {
    const value = params[key]
    if (value) next.set(key, value)
  }

  const query = next.toString()
  redirect(`/org/${targetOrg.slug}/calendar${query ? `?${query}` : ''}`)
}
