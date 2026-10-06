export const COMMENT_REACTION_TYPES = [
  'thumbs_up',
  'heart',
  'party',
  'eyes',
  'flame',
  'question',
  'alert',
] as const

export type CommentReactionType = (typeof COMMENT_REACTION_TYPES)[number]

export const COMMENT_REACTION_LABELS: Record<CommentReactionType, string> = {
  thumbs_up: 'Godkjent',
  heart:     'Liker',
  party:     'Bra jobbet',
  eyes:      'Sett',
  flame:     'Imponerende',
  question:  'Trenger vurdering',
  alert:     'Viktig',
}

export function isCommentReactionType(value: string): value is CommentReactionType {
  return (COMMENT_REACTION_TYPES as readonly string[]).includes(value)
}
