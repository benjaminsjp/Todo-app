// proxy.ts
import { auth } from '@/lib/auth/server'
import { NextRequest } from 'next/server'

const middleware = auth.middleware({
  loginUrl: '/api/auth/sign-in',
})

export default function handler(req: NextRequest) {
  if (req.method === 'POST') return

  return middleware(req)
}

export const config = {
  matcher: [
    '/((?!api|auth|_next/static|_next/image|favicon.ico).*)',
  ],
}