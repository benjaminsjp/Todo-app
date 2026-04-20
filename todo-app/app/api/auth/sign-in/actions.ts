'use server'
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { seedUserStatuses } from '@/lib/db/userStatuses'

export async function signInWithEmail(
  _prev: { error: string } | null,
  formData: FormData
) {
  const email = formData.get('email') as string
  if (!email) return { error: 'E-post er påkrevd' }

  const { error } = await auth.signIn.email({
    email,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message || 'Innlogging feilet' }
  redirect('/')
}

export async function signUpWithEmail(
  _prev: { error: string } | null,
  formData: FormData
) {
  const email = formData.get('email') as string
  if (!email) return { error: 'E-post er påkrevd' }

  const { data, error } = await auth.signUp.email({
    email,
    name:     formData.get('name') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message || 'Registrering feilet' }

  if (data?.user?.id) {
    await seedUserStatuses(data.user.id)
  }

  redirect('/')
}
