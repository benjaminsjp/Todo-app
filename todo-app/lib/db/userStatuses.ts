import { db } from '@/lib/db'
import { statuses } from '@/lib/db/schema'

export async function seedUserStatuses(userId: string) {
  await db.insert(statuses).values([
    { label: 'Todo',        color: 'gray',  order: 0, userId },
    { label: 'In Progress', color: 'blue',  order: 1, userId },
    { label: 'Done',        color: 'green', order: 2, userId },
  ])
}