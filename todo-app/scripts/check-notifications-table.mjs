import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const [table] = await sql`SELECT to_regclass('public.user_notifications') AS tbl`
console.log('user_notifications table:', table?.tbl ?? null)

try {
  const migrations = await sql`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 8
  `
  console.log('recent migrations:', migrations)
} catch (e) {
  console.log('migrations query failed:', e.message)
}
