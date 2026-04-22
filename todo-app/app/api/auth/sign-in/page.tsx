'use client'

import { useState, useActionState, useEffect } from 'react'
import { authClient } from '@/lib/auth/client'
import { signInWithEmail, signUpWithEmail, seedStatusesForCurrentUser } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AuthPage() {
  const [isSignUp, setIsSignUp]     = useState(false)
  const [step, setStep]             = useState<'auth' | 'verify'>('auth')
  const [email, setEmail]           = useState('')
  const [otp, setOtp]               = useState('')
  const [otpError, setOtpError]     = useState('')
  const [isPending, setIsPending]   = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const [signInState, signInAction] = useActionState(signInWithEmail, null)
  const [signUpState, signUpAction] = useActionState(signUpWithEmail, null)

  // Transition to verify step when signup succeeds (state === null, no error)
  useEffect(() => {
    if (submitted && signUpState === null) {
      setStep('verify')
      setSubmitted(false)
    }
  }, [signUpState, submitted])

  const handleSignUp = (formData: FormData) => {
    setEmail(formData.get('email') as string)
    setSubmitted(true)
    signUpAction(formData)
  }

  const handleVerifyOtp = async () => {
    setIsPending(true)
    setOtpError('')
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp })
    if (error) {
      setIsPending(false)
      return setOtpError(error.message || 'Invalid code')
    }

    await seedStatusesForCurrentUser()
    window.location.href = '/'
  }

  const handleResend = async () => {
    await authClient.sendVerificationEmail({
      email,
      callbackURL: window.location.origin + '/',
    })
  }

  if (step === 'verify') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 max-w-sm mx-auto px-4">
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
        <Button
          className="w-full"
          onClick={handleVerifyOtp}
          disabled={isPending || otp.length < 6}
        >
          {isPending ? 'Verifying...' : 'Confirm code'}
        </Button>
        <button
          onClick={handleResend}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Resend code
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 max-w-sm min-w-sm mx-auto px-4">
      <div className="text-center">
        <h1 className="text-3xl font-heading font-medium mb-1">
          {isSignUp ? 'Create an account' : 'Login to your account'}
        </h1>
      </div>

      <form action={isSignUp ? handleSignUp : signInAction} className="flex flex-col gap-4 w-full">
        {isSignUp && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" placeholder="Ola Nordmann" required />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="ola@example.no" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>

        {(signInState?.error || signUpState?.error) && (
          <p className="text-sm text-destructive">
            {signInState?.error || signUpState?.error}
          </p>
        )}

        <Button variant="brand" type="submit" className="w-full">
          {isSignUp ? 'Create account' : 'Login'}
        </Button>
      </form>

      <Button
        variant="ghost"
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
      </Button>
    </div>
  )
}