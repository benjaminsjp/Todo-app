import { put } from '@vercel/blob'
import { auth } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { data: session } = await auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
  }

  const formData  = await req.formData()
  const file      = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'Ingen fil ble lastet opp' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Kun bilder er tillatt' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Maksimum 2 MB' }, { status: 400 })
  }

  const blob = await put(
    `avatars/${session.user.id}-${Date.now()}.${file.type.split('/')[1]}`,
    file,
    { access: 'public' }
  )

  return NextResponse.json({ url: blob.url })
}
