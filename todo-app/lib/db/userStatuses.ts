import { db } from '@/lib/db'
import { statuses } from '@/lib/db/schema'
import { DEFAULT_STATUSES } from '@/lib/statusDefaults'

export async function seedUserStatuses(userId: string) {
  await db.insert(statuses).values(
    DEFAULT_STATUSES.map((s) => ({ ...s, userId }))
  )
}
