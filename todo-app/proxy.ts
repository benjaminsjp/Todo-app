// proxy.ts
import { auth } from '@/lib/auth/server'
import { isValidDemoCookie } from '@/lib/demo/session'
import { NextRequest } from 'next/server'

const middleware = auth.middleware({
  loginUrl: '/auth/sign-in',
})

const PUBLIC_PATHS = ['/', '/auth/demo']

function isPublicAsset(pathname: string) {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|ico|woff2?|ttf|eot)$/i.test(pathname)
}

export default function handler(req: NextRequest) {
    if (req.method === 'POST') return

    const { pathname } = req.nextUrl

    if (PUBLIC_PATHS.includes(pathname)) return
    if (isPublicAsset(pathname)) return

    if (isValidDemoCookie(req.cookies.get('demo_session')?.value)) return

    return middleware(req)
}

export const config = {
  matcher: [
    '/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
}
