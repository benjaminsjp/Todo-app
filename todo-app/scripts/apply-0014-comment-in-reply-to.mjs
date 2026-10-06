import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = neon(process.env.DATABASE_URL)

const migrationPath = join(__dirname, '../lib/db/migrations/0014_comment_in_reply_to.sql')
const raw = readFileSync(migrationPath, 'utf8')

const statements = raw
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean)

for (const statement of statements) {
  console.log('Running:', statement.slice(0, 80).replace(/\s+/g, ' '), '...')
  await sql.query(statement)
}

const [col] = await sql`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'in_reply_to_id'
  ) AS ok
`
console.log('Done. in_reply_to_id:', col?.ok ?? false)
