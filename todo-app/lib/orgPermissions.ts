export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

/** Matches server checks: viewers can read but not mutate org content. */
export function canEditOrgContent(role: string | null | undefined): boolean {
  return Boolean(role && role !== 'viewer')
}

export function canManageOrg(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'admin'
}
