import 'dotenv/config'
import { defineConfig } from "drizzle-kit"
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Drizzle migrations use Neon WebSockets in Node.
// Provide a WebSocket constructor so it can connect.
neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket

export default defineConfig({ 
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
 }
)