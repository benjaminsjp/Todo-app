export const COMMENT_REACTION_TYPES = [
  'thumbs_up',
  'heart',
  'smile',
  'party',
  'lightbulb',
  'eyes',
] as const

export type CommentReactionType = (typeof COMMENT_REACTION_TYPES)[number]

export const COMMENT_REACTION_LABELS: Record<CommentReactionType, string> = {
  thumbs_up: 'Tommel opp',
  heart:     'Hjerte',
  smile:     'Smilefjes',
  party:     'Feiring',
  lightbulb: 'Idé',
  eyes:      'Ser på',
}

export function isCommentReactionType(value: string): value is CommentReactionType {
  return (COMMENT_REACTION_TYPES as readonly string[]).includes(value)
}
