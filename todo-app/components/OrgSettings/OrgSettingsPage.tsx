'use client'

import { useActionState, useState } from 'react'
import { createInvitation, deleteInvitation, removeMember, updateMemberRole } from '@/lib/actions/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Trash2, Settings, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDate } from '@/lib/types'

type User = { id: string; displayName: string | null; email: string; avatarUrl: string | null }
type Member = { id: number; role: string; joinedAt: Date | null; user: User }
type Invite = { id: number; email: string; role: string; expiresAt: Date; createdAt: Date | null }
type Org    = { id: number; name: string; slug: string }

const ROLE_COLORS: Record<string, string> = {
  owner:  'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  admin:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  member: 'bg-green-500/10 text-green-600 border-green-500/20',
  viewer: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

function MemberAvatar({ member }: { member: Member }) {
  const initials = (member.user.displayName ?? member.user.email)
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Avatar className="size-8 cursor-pointer ring-2 ring-background">
          <AvatarImage src={member.user.avatarUrl ?? ''} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </HoverCardTrigger>
      <HoverCardContent className="w-56" side="top">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={member.user.avatarUrl ?? ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{member.user.displayName ?? member.user.email}</p>
            <p className="text-xs text-muted-foreground">{member.user.email}</p>
            <Badge variant="outline" className={`text-xs w-fit mt-1 ${ROLE_COLORS[member.role]}`}>
              {member.role}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Joined {formatDate(member.joinedAt)}
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}

function InviteForm({ orgId, orgSlug }: { orgId: number; orgSlug: string }) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const [state, action, isPending] = useActionState(createInvitation, null)

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link)
    setCopiedLink(link)
    toast.success('Invitation link copied!')
    setTimeout(() => setCopiedLink(null), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="orgId"   value={orgId} />
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="email" className="pb-2 block">Email</Label>
            <Input id="email" name="email" type="email" placeholder="colleague@example.com" required />
          </div>
          <div className="w-36">
            <Label className="pb-2 block">Role</Label>
            <Select name="role" defaultValue="member">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" variant="brand" disabled={isPending} className="self-start">
          {isPending ? 'Generating...' : 'Generate invite link'}
        </Button>
      </form>

      {state && 'link' in state && (
        <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2">
          <p className="text-sm text-muted-foreground truncate flex-1">{state.link}</p>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => handleCopy(state.link)}
          >
            {copiedLink === state.link ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      )}

      {state && 'error' in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </div>
  )
}

export function OrgSettingsPage({
  org,
  currentUserId,
  currentRole,
  members,
  pendingInvites,
}: {
  org:            Org
  currentUserId:  string
  currentRole:    string
  members:        Member[]
  pendingInvites: Invite[]
}) {
  const handleRemoveMember = async (memberId: number) => {
    const result = await removeMember(memberId, org.slug)
    if ('error' in result) toast.error(result.error)
    else toast.success('Member removed')
  }

  const handleRoleChange = async (memberId: number, role: string) => {
    const result = await updateMemberRole(memberId, role as 'admin' | 'member' | 'viewer', org.slug)
    if ('error' in result) toast.error(result.error)
    else toast.success('Role updated')
  }

  const handleDeleteInvite = async (id: number) => {
    const result = await deleteInvitation(id, org.slug)
    if ('error' in result) toast.error(result.error)
    else toast.success('Invitation revoked')
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-8 flex flex-col gap-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/org/${org.slug}`} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2">
          <ArrowLeft className='size-4' />{org.name}
        </Link>
      </div>
      <div>
        <h1 className="text-4xl font-medium font-heading mb-1">{org.name}</h1>
        <p className="text-muted-foreground text-sm">Organization settings</p>
      </div>

      {/* Members */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-medium mb-1">Members</h2>
          <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Avatar group */}
        <div className="flex -space-x-2">
          {members.map((m) => <MemberAvatar key={m.id} member={m} />)}
        </div>

        {/* Member list */}
        <div className="flex flex-col gap-2">
          {members.map((member) => {
            const isCurrentUser = member.user.id === currentUserId
            const isOwner       = member.role === 'owner'
            const canEdit       = !isOwner && !isCurrentUser && ['owner', 'admin'].includes(currentRole)

            return (
              <div key={member.id} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                <Avatar className="size-8">
                  <AvatarImage src={member.user.avatarUrl ?? ''} />
                  <AvatarFallback className="text-xs">
                    {(member.user.displayName ?? member.user.email)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.user.displayName ?? member.user.email}
                    {isCurrentUser && <span className="text-muted-foreground font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                </div>

                {canEdit ? (
                  <Select
                    defaultValue={member.role}
                    onValueChange={(role) => handleRoleChange(member.id, role)}
                  >
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={`text-xs ${ROLE_COLORS[member.role]}`}>
                    {member.role}
                  </Badge>
                )}

                {canEdit && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Invite */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-medium mb-1">Invite members</h2>
          <p className="text-sm text-muted-foreground">Generate an invite link locked to a specific email</p>
        </div>
        <InviteForm orgId={org.id} orgSlug={org.slug} />
      </section>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-medium">Pending invitations</h2>
          <div className="flex flex-col gap-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {formatDate(invite.expiresAt)} · {invite.role}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">Pending</Badge>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteInvite(invite.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}