// Writes .env.development.local (git-ignored) so `npm run dev` talks to the LOCAL Supabase
// stack. Vite reads that file only in development mode, so builds and tests never pick it up.
// Only the stack's public URL and publishable/anon key are written; values are not printed.
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const status = JSON.parse(execSync('npx supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString())
const url = status.API_URL
const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY
const { hostname } = new URL(url)

if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
  console.error('Refusing to write a local env file for a non-local Supabase URL.')
  process.exit(1)
}
if (!key) {
  console.error('No publishable key found; is `supabase start` running?')
  process.exit(1)
}

writeFileSync('.env.development.local', `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_PUBLISHABLE_KEY=${key}\n`)
console.log('.env.development.local written for the local Supabase stack (values not shown).')
