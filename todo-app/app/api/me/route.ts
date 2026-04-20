import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return NextResponse.json(null, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  return NextResponse.json({
    name:     user?.displayName ?? session.user.name,
    email:    user?.email,
    avatarUrl: user?.avatarUrl ?? session.user.image,
  })
}