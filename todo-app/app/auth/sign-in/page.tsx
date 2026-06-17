'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth/client'
import { seedStatusesForCurrentUser } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const authShell = 'flex flex-col items-center justify-center min-h-screen gap-6 w-full max-w-sm mx-auto px-4'
const fieldGroup = 'flex flex-col gap-1.5 w-full'
const fieldLabel = 'px-3'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState<'auth' | 'verify' | 'forgot' | 'reset'>('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const [resetEmailPending, setResetEmailPending] = useState(false)
  const [resetEmailError, setResetEmailError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetPending, setResetPending] = useState(false)
  const [resetError, setResetError] = useState('')

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (token) setStep('reset')
  }, [])

  const appOrigin =
    (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') as string | undefined) ??
    window.location.origin

  const finishLogin = async () => {
    await seedStatusesForCurrentUser()
    window.location.href = '/dashboard'
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthPending(true)

    const { error } = await authClient.signIn.email({ email, password })

    if (error) {
      setPassword('')
      const message = error.message || 'Sign in failed'
      const needsVerification = /verif/i.test(message) || /invalid email or password/i.test(message)
      setAuthError(
        needsVerification && !isSignUp
          ? `${message}. If you recently signed up, check your inbox for a verification code first.`
          : message
      )
      setAuthPending(false)
      return
    }

    await finishLogin()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthPending(true)

    const { error } = await authClient.signUp.email({ email, password, name })

    if (error) {
      setPassword('')
      setAuthError(error.message || 'Sign up failed')
      setAuthPending(false)
      return
    }

    setAuthPending(false)
    setStep('verify')
  }

  const handleVerifyOtp = async () => {
    setIsPending(true)
    setOtpError('')
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp })
    if (error) {
      setIsPending(false)
      return setOtpError(error.message || 'Invalid code')
    }
    await finishLogin()
  }

  const handleResend = async () => {
    await authClient.sendVerificationEmail({
      email,
      callbackURL: appOrigin + '/dashboard',
    })
  }

  const handleSendResetEmail = async () => {
    setResetEmailPending(true)
    setResetEmailError('')
    setResetEmailSent(false)

    try {
      const redirectTo = `${appOrigin}/auth/sign-in`
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || 'Could not send reset email')
      }

      setResetEmailSent(true)
    } catch (e) {
      setResetEmailError(e instanceof Error ? e.message : 'Could not send reset email')
    } finally {
      setResetEmailPending(false)
    }
  }

  const handleResetWithOtp = async () => {
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
        throw new Error(body?.message || 'Could not reset password')
      }

      setIsSignUp(false)
      setPassword('')
      setNewPassword('')
      setResetOtp('')
      setStep('auth')
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Could not reset password')
    } finally {
      setResetPending(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className={authShell}>
        <div className="text-center">
          <h1 className="text-3xl font-heading font-medium mb-2">Check your inbox</h1>
          <p className="text-muted-foreground text-sm">
            We sent a code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        <Input
          type="text"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="text-center text-2xl tracking-widest"
          maxLength={6}
        />
        {otpError && <p className="text-sm text-destructive">{otpError}</p>}
        <Button className="w-full" onClick={handleVerifyOtp} disabled={isPending || otp.length < 6}>
          {isPending ? 'Verifying...' : 'Confirm code'}
        </Button>
        <button onClick={handleResend} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Resend code
        </button>
        <Button
          variant="ghost"
          onClick={() => setStep('auth')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to login
        </Button>
      </div>
    )
  }

  if (step === 'forgot') {
    return (
      <div className={authShell}>
        <div className="text-center">
          <h1 className="text-3xl font-heading font-medium mb-2">Reset your password</h1>
          <p className="text-muted-foreground text-sm">We&apos;ll send you a password reset email.</p>
        </div>

        <div className={fieldGroup}>
          <Label className={fieldLabel} htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {resetEmailError && <p className="text-sm text-destructive">{resetEmailError}</p>}
        {resetEmailSent && <p className="text-sm text-muted-foreground">Check your inbox for a reset link.</p>}

        <Button
          variant="brand"
          className="w-full"
          onClick={handleSendResetEmail}
          disabled={resetEmailPending || !email}
        >
          {resetEmailPending ? 'Sending…' : 'Send reset email'}
        </Button>

        <Button
          variant="ghost"
          onClick={() => setStep('auth')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to login
        </Button>
      </div>
    )
  }

  if (step === 'reset') {
    const token = new URLSearchParams(window.location.search).get('token')
    const isLinkReset = Boolean(token)

    const handleLinkReset = async () => {
      setResetPending(true)
      setResetError('')

      try {
        if (!token) throw new Error('Invalid or expired reset link.')

        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword, token }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.message || 'Could not reset password')
        }

        setIsSignUp(false)
        setPassword('')
        setNewPassword('')
        window.history.replaceState({}, '', '/auth/sign-in')
        setStep('auth')
      } catch (e) {
        setResetError(e instanceof Error ? e.message : 'Could not reset password')
      } finally {
        setResetPending(false)
      }
    }

    return (
      <div className={authShell}>
        <div className="text-center">
          <h1 className="text-3xl font-heading font-medium mb-2">New password</h1>
          <p className="text-muted-foreground text-sm">Choose a new password for your account.</p>
        </div>

        {!isLinkReset && (
          <div className={fieldGroup}>
            <Label className={fieldLabel} htmlFor="reset-otp">Code</Label>
            <Input
              id="reset-otp"
              type="text"
              value={resetOtp}
              onChange={(e) => setResetOtp(e.target.value)}
              className="text-center tracking-widest"
              maxLength={6}
            />
          </div>
        )}

        <div className={fieldGroup}>
          <Label className={fieldLabel} htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        {resetError && <p className="text-sm text-destructive">{resetError}</p>}

        <Button
          variant="brand"
          className="w-full"
          onClick={isLinkReset ? handleLinkReset : handleResetWithOtp}
          disabled={resetPending || newPassword.length < 8 || (!isLinkReset && resetOtp.length < 6)}
        >
          {resetPending ? 'Saving…' : 'Set new password'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setNewPassword('')
              setResetOtp('')
              setResetError('')
              window.history.replaceState({}, '', '/auth/sign-in')
              setStep('auth')
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to login
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setNewPassword('')
              setResetOtp('')
              setResetError('')
              setResetEmailError('')
              setResetEmailSent(false)
              window.history.replaceState({}, '', '/auth/sign-in')
              setStep('forgot')
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Request a new reset
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={authShell}>
      <div className="text-center">
        <h1 className="text-3xl font-heading font-medium mb-1">
          {isSignUp ? 'Create an account' : 'Login to your account'}
        </h1>
      </div>

      <form
        onSubmit={isSignUp ? handleSignUp : handleSignIn}
        className="flex flex-col gap-4 w-full"
      >
        {isSignUp && (
          <div className={fieldGroup}>
            <Label className={fieldLabel} htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className={fieldGroup}>
          <Label className={fieldLabel} htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={fieldGroup}>
          <Label className={fieldLabel} htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {authError && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-destructive">{authError}</p>
            {!isSignUp && /verification code/i.test(authError) && (
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Enter verification code
              </button>
            )}
          </div>
        )}

        <Button variant="brand" type="submit" className="w-full" disabled={authPending}>
          {authPending ? (isSignUp ? 'Creating account…' : 'Logging in…') : (isSignUp ? 'Create account' : 'Login')}
        </Button>
      </form>

      {!isSignUp && (
        <button onClick={() => setStep('forgot')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Forgot password?
        </button>
      )}

      <Button
        variant="ghost"
        onClick={() => {
          setIsSignUp(!isSignUp)
          setAuthError('')
        }}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
      </Button>

      <Button variant="outline" className="w-full" asChild>
        <Link href="/auth/demo">Try demo without signing up</Link>
      </Button>
    </div>
  )
}
