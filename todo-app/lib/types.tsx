export type User = {
  id:          string
  displayName: string | null
  avatarUrl:   string | null
  email:       string
}

export type Comment = {
  id:        number
  content:   string
  createdAt: Date | null
  userId:    string
  taskId:    number
  updatedAt: Date | null
  user?:     User | null
}

export type Status = {
  id:    number
  label: string
  color: string
}

export type TaskGroup = {
  id:        number
  title:     string
  color:     string
  tasks?:    Task[]
  createdBy: string | null
  orgId:     number | null
  createdAt: Date | null
}

export type Task = {
  id:          number
  title:       string
  description: string | null
  slug:        string
  deadline:    string | null
  statusId:    number | null
  groupId:     number | null
  orgId:       number | null
  assigneeId:  string | null
  createdBy:   string | null
  createdAt:   Date | null
  updatedAt:   Date | null
  group?:      TaskGroup | null
  status?:     Status | null
  comments?:   Comment[]
}

export type Org = {
  id: number; name: string; slug: string
  tasks: Task[]; groups: TaskGroup[]
}

// Hjelpefunksjoner som brukes på tvers av komponenter
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('no-NO', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

export function mapComments(comments: Comment[] = []) {
  return comments.map((c) => ({
    id:                   c.id,
    content:              c.content,
    createdAt:            formatDate(c.createdAt),
    author:               c.user?.displayName ?? c.user?.email ?? 'Ukjent',
    authorProfilePicture: c.user?.avatarUrl ?? '',
  }))
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export const colorMap: Record<string, { bg: string; border: string; text: string, opacity: string }> = {
  'bg-pink-500':   { bg: 'bg-pink-500',   border: 'border-pink-500',   text: 'text-pink-500', opacity: 'bg-pink-500/20' },
  'bg-purple-500': { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', opacity: 'bg-purple-500/20' },
  'bg-blue-500':   { bg: 'bg-blue-500',   border: 'border-blue-500',   text: 'text-blue-500', opacity: 'bg-blue-500/20' },
  'bg-green-500':  { bg: 'bg-green-500',  border: 'border-green-500',  text: 'text-green-500', opacity: 'bg-green-500/20' },
  'bg-orange-500': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', opacity: 'bg-orange-500/20' },
  'bg-red-500':    { bg: 'bg-red-500',    border: 'border-red-500',    text: 'text-red-500', opacity: 'bg-red-500/20' },
  'bg-yellow-500': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', opacity: 'bg-yellow-500/20' },
  'bg-gray-500':   { bg: 'bg-gray-500',   border: 'border-gray-500',   text: 'text-gray-500', opacity: 'bg-gray-500/20' },
}

export function getColor(bg: string) {
  return colorMap[bg] ?? colorMap['bg-gray-500']
}
