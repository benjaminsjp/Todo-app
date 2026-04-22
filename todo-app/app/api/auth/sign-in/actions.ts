'use server'

import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { statuses, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { seedUserStatuses } from '@/lib/db/userStatuses'
import { redirect } from 'next/navigation'
import { syncUser } from '@/lib/db/users'

export async function signInWithEmail(
  _prev: { error: string } | null | undefined,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const { data, error } = await auth.signIn.email({
    email,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message || 'Sign in failed' }

  if (data?.user) {
    await syncUser({
      id:    data.user.id,
      email: data.user.email,
      name:  data.user.name,
      image: data.user.image,
    })
  }

  redirect('/')
}


export async function signUpWithEmail(
  _prev: { error: string } | null | undefined,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const { error } = await auth.signUp.email({
    email,
    name:     formData.get('name') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message || 'Sign up failed' }
  return null 
}

export async function seedStatusesForCurrentUser() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return { error: 'Not logged in' }

  await syncUser({
    id:    session.user.id,
    email: session.user.email,
    name:  session.user.name,
    image: session.user.image,
  })

  const existing = await db.query.statuses.findFirst({
    where: eq(statuses.userId, session.user.id),
  })
  if (existing) return { success: true }

  await seedUserStatuses(session.user.id)
  return { success: true }
}
