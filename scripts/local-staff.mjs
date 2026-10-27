// Creates (or with --delete, removes) a throwaway staff account on the LOCAL Supabase stack
// for manual and browser testing. The generated password is written to supabase/.temp/
// (git-ignored) and is never printed.
//
// Staff membership is written as the local database owner (psql in the local container),
// because no API role — not even the service role — may write public.staff_users.
import { execFileSync, execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const EMAIL = 'staff.local@iturrieta.test'
const CREDENTIALS_FILE = 'supabase/.temp/local-staff.json'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const status = JSON.parse(execSync('npx supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString())
const { hostname } = new URL(status.API_URL)
if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
  console.error('Refusing to manage staff accounts on a non-local Supabase project.')
  process.exit(1)
}

const projectId = /^project_id\s*=\s*"([^"]+)"/m.exec(readFileSync('supabase/config.toml', 'utf8'))?.[1]
const localSql = (sql) =>
  execFileSync('docker', ['exec', '-i', `supabase_db_${projectId}`, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-q', '-v', 'ON_ERROR_STOP=1'], {
    input: sql,
    stdio: ['pipe', 'ignore', 'inherit'],
  })

const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY ?? status.SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: list, error: listError } = await admin.auth.admin.listUsers()
if (listError) throw listError
const existing = list.users.find((user) => user.email === EMAIL)

if (process.argv.includes('--delete')) {
  if (existing && UUID_RE.test(existing.id)) {
    localSql(`delete from public.staff_users where user_id = '${existing.id}';`)
    const { error } = await admin.auth.admin.deleteUser(existing.id)
    // Bookings the account entered or changed keep their audit link, which blocks deletion.
    if (error) console.log('Staff access removed; the auth account is kept because reservations reference it.')
  }
  rmSync(CREDENTIALS_FILE, { force: true })
  console.log('Local staff account removed.')
  process.exit(0)
}

const password = randomBytes(18).toString('base64url')
const { data, error } = existing
  ? await admin.auth.admin.updateUserById(existing.id, { password })
  : await admin.auth.admin.createUser({ email: EMAIL, password, email_confirm: true })
if (error) throw error
if (!UUID_RE.test(data.user.id)) throw new Error('Unexpected user id format.')

localSql(
  `insert into public.staff_users (user_id, active) values ('${data.user.id}', true) on conflict (user_id) do update set active = true;`,
)

mkdirSync('supabase/.temp', { recursive: true })
writeFileSync(CREDENTIALS_FILE, JSON.stringify({ email: EMAIL, password }))
console.log(`Local staff account ready (${EMAIL}); password stored in ${CREDENTIALS_FILE}.`)
