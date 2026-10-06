import type { LucideIcon } from 'lucide-react'
import { Eye, Heart, Lightbulb, PartyPopper, Smile, ThumbsUp } from 'lucide-react'
import {
  COMMENT_REACTION_TYPES,
  type CommentReactionType,
} from '@/lib/commentReactions'

export const COMMENT_REACTION_ICONS: Record<CommentReactionType, LucideIcon> = {
  thumbs_up: ThumbsUp,
  heart:     Heart,
  smile:     Smile,
  party:     PartyPopper,
  lightbulb: Lightbulb,
  eyes:      Eye,
}

export { COMMENT_REACTION_TYPES }
