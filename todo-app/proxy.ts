import { auth } from '@/lib/auth/server'

export default auth.middleware({
  loginUrl: '/api/auth/sign-in',
})

export const config = {
  matcher: [
    '/account/:path*',
  ],
}