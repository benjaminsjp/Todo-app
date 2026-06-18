import { NextRequest, NextResponse } from 'next/server'
import { signOutApp } from '@/lib/auth/server'
import { getAppBaseUrl } from '@/lib/utils/appUrl'

async function signOutAndRedirect(request: NextRequest) {
  await signOutApp()

  const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/'
  const baseUrl = await getAppBaseUrl()

  return NextResponse.redirect(new URL(redirectTo, baseUrl))
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request)
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request)
}
