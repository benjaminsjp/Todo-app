'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { authClient } from '@/lib/auth/client'
import { authErrorMessage, isVerificationRelatedMessage } from '@/lib/auth/errorMessages'
import {
  AuthScreen,
  AuthErrorBanner,
  AuthSuccessBanner,
  AuthFooterLinks,
  AuthTextButton,
} from '@/components/Auth/AuthScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const fieldGroup = 'flex flex-col gap-1.5 w-full'

async function waitForClientSession(maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await authClient.getSession()
    if (data?.user) return true
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  return false
}

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState<'auth' | 'verify' | 'forgot' | 'reset'>('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [verifyPending, setVerifyPending] = useState(false)

  const [resetEmailPending, setResetEmailPending] = useState(false)
  const [resetEmailError, setResetEmailError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetPending, setResetPending] = useState(false)
  const [resetError, setResetError] = useState('')

  const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const [appOrigin, setAppOrigin] = useState(envOrigin ?? '')
  const [resetToken, setResetToken] = useState<string | null>(null)

  useEffect(() => {
    if (!appOrigin) setAppOrigin(window.location.origin)

    const token = new URLSearchParams(window.location.search).get('token')
    if (token) {
      setResetToken(token)
      setStep('reset')
    }
  }, [appOrigin])

  const origin = appOrigin || envOrigin || ''

  const goToApp = useCallback(async () => {
    const hasSession = await waitForClientSession()
    if (!hasSession) {
      throw new Error('Innloggingen fullførte ikke. Prøv igjen.')
    }
    router.push('/dashboard')
    router.refresh()
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    setAuthPending(true)

    try {
      const { error } = await authClient.signIn.email({ email, password })

      if (error) {
        setPassword('')
        setAuthError(authErrorMessage(error, 'Innlogging mislyktes'))
        return
      }

      await goToApp()
    } catch (err) {
      setPassword('')
      setAuthError(authErrorMessage(err, 'Innlogging mislyktes'))
    } finally {
      setAuthPending(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    setAuthPending(true)

    try {
      const { error } = await authClient.signUp.email({ email, password, name: name.trim() })

      if (error) {
        setPassword('')
        setAuthError(authErrorMessage(error, 'Registrering mislyktes'))
        return
      }

      setStep('verify')
    } catch (err) {
      setPassword('')
      setAuthError(authErrorMessage(err, 'Registrering mislyktes'))
    } finally {
      setAuthPending(false)
    }
  }

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setVerifyPending(true)
    setOtpError('')

    try {
      const { error } = await authClient.emailOtp.verifyEmail({ email, otp })
      if (error) {
        setOtpError(authErrorMessage(error, 'Ugyldig kode'))
        return
      }
      await goToApp()
    } catch (err) {
      setOtpError(authErrorMessage(err, 'Kunne ikke bekrefte koden'))
    } finally {
      setVerifyPending(false)
    }
  }

  const handleResend = async () => {
    setOtpError('')
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${origin || window.location.origin}/dashboard`,
      })
      if (error) {
        setOtpError(authErrorMessage(error, 'Kunne ikke sende kode på nytt'))
      }
    } catch (err) {
      setOtpError(authErrorMessage(err, 'Kunne ikke sende kode på nytt'))
    }
  }

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetEmailPending(true)
    setResetEmailError('')
    setResetEmailSent(false)

    try {
      const redirectTo = `${origin || window.location.origin}/auth/sign-in`
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || 'Kunne ikke sende tilbakestillings-e-post')
      }

      setResetEmailSent(true)
    } catch (err) {
      setResetEmailError(authErrorMessage(err, 'Kunne ikke sende tilbakestillings-e-post'))
    } finally {
      setResetEmailPending(false)
    }
  }

  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetPending(true)
    setResetError('')

    try {
      const res = await fetch('/api/auth/email-otp/passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: resetOtp, password: newPassword }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || 'Kunne ikke tilbakestille passord')
      }

      setIsSignUp(false)
      setPassword('')
      setNewPassword('')
      setResetOtp('')
      setStep('auth')
      setAuthError('')
    } catch (err) {
      setResetError(authErrorMessage(err, 'Kunne ikke tilbakestille passord'))
    } finally {
      setResetPending(false)
    }
  }

  if (step === 'verify') {
    return (
      <AuthScreen
        title="Bekreft e-posten din"
        description={`Vi sendte en sekssifret kode til ${email}.`}
        footer={
          <AuthFooterLinks>
            <p>
              Fikk du ingen e-post?{' '}
              <AuthTextButton onClick={() => void handleResend()}>Send på nytt</AuthTextButton>
            </p>
            <AuthTextButton onClick={() => setStep('auth')}>Tilbake til innlogging</AuthTextButton>
          </AuthFooterLinks>
        }
      >
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <div className={fieldGroup}>
            <Label htmlFor="otp">Bekreftelseskode</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-xl tracking-[0.35em] tabular-nums"
              maxLength={6}
            />
          </div>
          {otpError && <AuthErrorBanner message={otpError} />}
          <Button type="submit" className="w-full" disabled={verifyPending || otp.length < 6}>
            {verifyPending ? 'Bekrefter…' : 'Bekreft og fortsett'}
          </Button>
        </form>
      </AuthScreen>
    )
  }

  if (step === 'forgot') {
    return (
      <AuthScreen
        title="Glemt passord?"
        description="Skriv inn e-postadressen din, så sender vi en lenke for å sette et nytt passord."
        footer={
          <AuthTextButton onClick={() => setStep('auth')}>Tilbake til innlogging</AuthTextButton>
        }
      >
        <form onSubmit={handleSendResetEmail} className="flex flex-col gap-4">
          <div className={fieldGroup}>
            <Label htmlFor="reset-email">E-post</Label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {resetEmailError && <AuthErrorBanner message={resetEmailError} />}
          {resetEmailSent && (
            <AuthSuccessBanner message="Sjekk innboksen — vi har sendt en tilbakestillingslenke hvis kontoen finnes." />
          )}
          <Button type="submit" className="w-full" disabled={resetEmailPending || !email}>
            {resetEmailPending ? 'Sender…' : 'Send tilbakestillings-e-post'}
          </Button>
        </form>
      </AuthScreen>
    )
  }

  if (step === 'reset') {
    const isLinkReset = Boolean(resetToken)

    const handleLinkReset = async (e: React.FormEvent) => {
      e.preventDefault()
      setResetPending(true)
      setResetError('')

      try {
        if (!resetToken) throw new Error('Ugyldig eller utløpt tilbakestillingslenke.')

        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword, token: resetToken }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.message || 'Kunne ikke tilbakestille passord')
        }

        setPassword('')
        setNewPassword('')
        window.history.replaceState({}, '', '/auth/sign-in')
        setStep('auth')
        setAuthSuccess('Passordet er oppdatert. Du kan logge inn nå.')
      } catch (err) {
        setResetError(authErrorMessage(err, 'Kunne ikke tilbakestille passord'))
      } finally {
        setResetPending(false)
      }
    }

    return (
      <AuthScreen
        title="Velg nytt passord"
        description="Passordet må være minst 8 tegn."
        footer={
          <AuthFooterLinks>
            <AuthTextButton
              onClick={() => {
                setNewPassword('')
                setResetOtp('')
                setResetError('')
                window.history.replaceState({}, '', '/auth/sign-in')
                setStep('auth')
              }}
            >
              Tilbake til innlogging
            </AuthTextButton>
            {!isLinkReset && (
              <AuthTextButton onClick={() => setStep('forgot')}>Be om ny tilbakestilling</AuthTextButton>
            )}
          </AuthFooterLinks>
        }
      >
        <form
          onSubmit={isLinkReset ? handleLinkReset : handleResetWithOtp}
          className="flex flex-col gap-4"
        >
          {!isLinkReset && (
            <div className={fieldGroup}>
              <Label htmlFor="reset-otp">Kode fra e-post</Label>
              <Input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center tracking-[0.35em] tabular-nums"
                maxLength={6}
              />
            </div>
          )}
          <div className={fieldGroup}>
            <Label htmlFor="new-password">Nytt passord</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {resetError && <AuthErrorBanner message={resetError} />}
          <Button
            type="submit"
            className="w-full"
            disabled={resetPending || newPassword.length < 8 || (!isLinkReset && resetOtp.length < 6)}
          >
            {resetPending ? 'Lagrer…' : 'Lagre nytt passord'}
          </Button>
        </form>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title={isSignUp ? 'Opprett konto' : 'Logg inn'}
      description={
        isSignUp
          ? 'Kom i gang med oppgaver, tavler og samarbeid.'
          : 'Velkommen tilbake — logg inn for å fortsette.'
      }
      footer={
        <>
          <AuthFooterLinks>
            <p>
              {isSignUp ? 'Har du allerede konto?' : 'Har du ikke konto?'}{' '}
              <AuthTextButton
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setAuthError('')
                  setAuthSuccess('')
                }}
              >
                {isSignUp ? 'Logg inn' : 'Registrer deg'}
              </AuthTextButton>
            </p>
          </AuthFooterLinks>
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              eller
            </span>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/auth/demo">Prøv demo uten registrering</Link>
          </Button>
        </>
      }
    >
      <form
        onSubmit={isSignUp ? handleSignUp : handleSignIn}
        className="flex flex-col gap-4"
      >
        {isSignUp && (
          <div className={fieldGroup}>
            <Label htmlFor="name">Navn</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className={fieldGroup}>
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={fieldGroup}>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Passord</Label>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setStep('forgot')
                  setAuthError('')
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Glemt passord?
              </button>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={isSignUp ? 8 : undefined}
            required
          />
          {isSignUp && (
            <p className="text-xs text-muted-foreground">Minst 8 tegn.</p>
          )}
        </div>

        {authSuccess && <AuthSuccessBanner message={authSuccess} />}

        {authError && (
          <div className="space-y-2">
            <AuthErrorBanner message={authError} />
            {!isSignUp && isVerificationRelatedMessage(authError) && (
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Skriv inn bekreftelseskode
              </button>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={authPending}>
          {authPending
            ? isSignUp
              ? 'Oppretter konto…'
              : 'Logger inn…'
            : isSignUp
              ? 'Opprett konto'
              : 'Logg inn'}
        </Button>
      </form>
    </AuthScreen>
  )
}
