import type { LucideIcon } from 'lucide-react'
import {
  CircleAlert,
  CircleQuestionMark,
  Eye,
  Flame,
  Heart,
  PartyPopper,
  ThumbsUp,
} from 'lucide-react'
import {
  COMMENT_REACTION_TYPES,
  type CommentReactionType,
} from '@/lib/commentReactions'

export const COMMENT_REACTION_ICONS: Record<CommentReactionType, LucideIcon> = {
  thumbs_up: ThumbsUp,
  heart:     Heart,
  party:     PartyPopper,
  eyes:      Eye,
  flame:     Flame,
  question:  CircleQuestionMark,
  alert:     CircleAlert,
}

export { COMMENT_REACTION_TYPES }
