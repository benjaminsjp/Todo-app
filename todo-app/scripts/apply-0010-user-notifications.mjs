import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = neon(process.env.DATABASE_URL)

const migrationPath = join(__dirname, '../lib/db/migrations/0010_user_notifications.sql')
const raw = readFileSync(migrationPath, 'utf8')

const statements = raw
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean)

for (const statement of statements) {
  console.log('Running:', statement.slice(0, 80).replace(/\s+/g, ' '), '...')
  await sql.query(statement)
}

const [table] = await sql`SELECT to_regclass('public.user_notifications') AS tbl`
console.log('Done. user_notifications table:', table?.tbl ?? null)
