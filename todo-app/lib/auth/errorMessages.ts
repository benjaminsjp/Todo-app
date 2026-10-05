/** Map Neon / Better Auth messages to user-facing Norwegian copy. */
export function authErrorMessage(error: unknown, fallback: string): string {
  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: string }).message)
      : error instanceof Error
        ? error.message
        : ''

  const msg = raw.trim() || fallback
  const lower = msg.toLowerCase()

  if (lower.includes('invalid email or password') || lower.includes('invalid credentials')) {
    return 'Ugyldig e-post eller passord.'
  }
  if (lower.includes('user already exists') || lower.includes('already exists')) {
    return 'En bruker med denne e-posten finnes allerede. Prøv å logge inn.'
  }
  if (lower.includes('password') && lower.includes('short')) {
    return 'Passordet er for kort. Bruk minst 8 tegn.'
  }
  if (lower.includes('verify') || lower.includes('verification') || lower.includes('not verified')) {
    return 'E-posten er ikke bekreftet ennå. Sjekk innboksen for bekreftelseskode.'
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Kunne ikke nå innloggingstjenesten. Sjekk nettverket og prøv igjen.'
  }

  return msg
}

export function isVerificationRelatedMessage(message: string): boolean {
  return /verif|bekreft|bekreftelseskode/i.test(message)
}
