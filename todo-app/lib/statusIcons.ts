import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleEllipsis,
  CirclePause,
  CircleX,
  Clock,
  Flag,
  Hourglass,
  ListTodo,
  Pause,
  Play,
  Star,
  type LucideIcon,
} from 'lucide-react'

export const STATUS_ICON_OPTIONS = [
  { name: 'CircleDashed',   icon: CircleDashed,   label: 'Todo' },
  { name: 'CircleEllipsis', icon: CircleEllipsis, label: 'In progress' },
  { name: 'CircleCheck',    icon: CircleCheck,    label: 'Done' },
  { name: 'Circle',         icon: Circle,         label: 'Open' },
  { name: 'CircleDot',      icon: CircleDot,      label: 'Active' },
  { name: 'CirclePause',    icon: CirclePause,    label: 'Paused' },
  { name: 'CircleX',        icon: CircleX,        label: 'Cancelled' },
  { name: 'Clock',          icon: Clock,          label: 'Waiting' },
  { name: 'Hourglass',      icon: Hourglass,      label: 'Pending' },
  { name: 'Flag',           icon: Flag,           label: 'Priority' },
  { name: 'Star',           icon: Star,           label: 'Important' },
  { name: 'ListTodo',       icon: ListTodo,       label: 'Backlog' },
  { name: 'Play',           icon: Play,           label: 'Started' },
  { name: 'Pause',          icon: Pause,          label: 'On hold' },
] as const

export type StatusIconName = (typeof STATUS_ICON_OPTIONS)[number]['name']

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  STATUS_ICON_OPTIONS.map((o) => [o.name, o.icon])
)

const COLOR_ICON_FALLBACK: Record<string, StatusIconName> = {
  gray:   'CircleDashed',
  blue:   'CircleEllipsis',
  green:  'CircleCheck',
  yellow: 'Circle',
  orange: 'Circle',
  red:    'CircleX',
  purple: 'CircleDot',
  pink:   'Star',
}

const COLOR_CLASS: Record<string, string> = {
  gray:   'text-muted-foreground',
  blue:   'text-blue-500',
  green:  'text-green-500',
  yellow: 'text-yellow-500',
  orange: 'text-orange-500',
  red:    'text-red-500',
  purple: 'text-purple-500',
  pink:   'text-pink-500',
}

export function resolveStatusIcon(icon?: string | null, color = 'gray') {
  const iconName = icon ?? COLOR_ICON_FALLBACK[color] ?? 'CircleDashed'
  const Icon = ICON_MAP[iconName] ?? CircleDashed
  const className = COLOR_CLASS[color] ?? COLOR_CLASS.gray
  return { Icon, className }
}
