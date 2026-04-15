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

export function bgToBorder(bg: string): string {
  return bg.replace('bg-', 'border-')
}