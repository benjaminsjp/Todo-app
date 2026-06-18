export const DEFAULT_STATUS_LABELS = {
  todo: 'Å gjøre',
  inProgress: 'Pågår',
  done: 'Ferdig',
} as const

export const DEFAULT_STATUSES = [
  { label: DEFAULT_STATUS_LABELS.todo, color: 'gray', icon: 'CircleDashed', order: 0 },
  { label: DEFAULT_STATUS_LABELS.inProgress, color: 'blue', icon: 'CircleEllipsis', order: 1 },
  { label: DEFAULT_STATUS_LABELS.done, color: 'green', icon: 'CircleCheck', order: 2 },
] as const
