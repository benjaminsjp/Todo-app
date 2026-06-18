// proxy.ts
import { auth } from '@/lib/auth/server'
import { isValidDemoCookie } from '@/lib/demo/session'
import { NextRequest, NextResponse } from 'next/server'

const middleware = auth.middleware({
  loginUrl: '/auth/sign-in',
})

const PUBLIC_PATHS = ['/', '/auth/demo', '/auth/sign-in']

function isPublicAsset(pathname: string) {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|ico|woff2?|ttf|eot)$/i.test(pathname)
}

function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export default function handler(req: NextRequest) {
  if (req.method === 'POST') return

  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) return nextWithPathname(req)
  if (isPublicAsset(pathname)) return nextWithPathname(req)

  if (isValidDemoCookie(req.cookies.get('demo_session')?.value)) {
    return nextWithPathname(req)
  }

  const authResult = middleware(req)
  if (authResult) return authResult

  return nextWithPathname(req)
}

export const config = {
  matcher: [
    '/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
}
