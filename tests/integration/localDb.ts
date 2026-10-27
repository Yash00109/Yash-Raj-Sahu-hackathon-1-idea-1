import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/**
 * SQL access to the LOCAL Supabase Postgres container only (docker exec, as `postgres`).
 * Used for catalog checks and for rebuilding the local schema from the hosted snapshot.
 */
const projectId = /^project_id\s*=\s*"([^"]+)"/m.exec(readFileSync('supabase/config.toml', 'utf8'))?.[1]
if (!projectId) throw new Error('project_id not found in supabase/config.toml')
const container = `supabase_db_${projectId}`

export const sqlFile = (path: string) => readFileSync(path, 'utf8')

/** Runs SQL through psql; returns unaligned, tab-separated output. Throws with psql's error text. */
export function psql(sql: string): string {
  try {
    return execFileSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-q', '-A', '-t', '-F', '\t', '-v', 'ON_ERROR_STOP=1'], {
      input: sql,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .toString()
      .trim()
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? String(error)
    throw new Error(stderr.split('\n').filter((line) => line.startsWith('ERROR')).join('\n') || stderr)
  }
}

/** Runs SQL that is expected to fail; returns the ERROR line. */
export function psqlError(sql: string): string {
  try {
    psql(sql)
  } catch (error) {
    return (error as Error).message
  }
  throw new Error('Expected the SQL to fail, but it succeeded.')
}

export const rows = (output: string) => (output ? output.split('\n').map((line) => line.split('\t')) : [])

export const SNAPSHOT = 'supabase/snapshots/remote_public_schema.sql'
export const MIGRATION = 'supabase/drafts/0001_reservation_backend.sql'
export const ROLLBACK = 'supabase/drafts/0001_reservation_backend.rollback.sql'
export const TEARDOWN = 'supabase/drafts/0001_reservation_backend.teardown.sql'
export const PRECHECK = 'supabase/drafts/hosted-precheck.sql'
export const MIGRATION_2 = 'supabase/drafts/0002_availability_and_tracker.sql'
export const ROLLBACK_2 = 'supabase/drafts/0002_availability_and_tracker.rollback.sql'

/** Replaces the local public schema with the captured hosted snapshot. LOCAL ONLY. */
export function rebuildFromSnapshot() {
  psql('drop schema if exists public cascade;')
  psql(sqlFile(SNAPSHOT))
}

export function migrate() {
  psql(sqlFile(MIGRATION))
}

/** 0001 then 0002: the schema the application code expects. */
export function migrateAll() {
  psql(sqlFile(MIGRATION))
  psql(sqlFile(MIGRATION_2))
}

/** A date `days` ahead in venue time, as YYYY-MM-DD. */
export const madridDate = (days: number) => psql(`select ((now() at time zone 'Europe/Madrid')::date + ${Math.trunc(days)})::text;`)

/** Inserts a reservation as the database owner (no API role may insert directly). Returns its id. */
export function insertReservation(values: Record<string, string | number | null>): string {
  const row = { guest_name: 'Seeded Guest', phone: '+34611222333', reservation_time: '20:30', party_size: 2, seating_preference: 'indoor', preferred_language: 'es', ...values }
  const literal = (v: string | number | null) => (v === null ? 'null' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)
  return psql(`insert into public.reservations (${Object.keys(row).join(', ')}) values (${Object.values(row).map(literal).join(', ')}) returning id;`)
}

/** Precheck rows keyed by check number: [n, check, result, found, expected]. */
export function precheck() {
  return rows(psql(sqlFile(PRECHECK)))
}

/** A fingerprint of schema objects and privileges, to prove a script changed nothing. */
export function schemaFingerprint(): string {
  return psql(`
    select md5(string_agg(x, '|' order by x)) from (
      select 'c:' || c.oid::regclass || ':' || coalesce(c.relacl::text, '') || ':' || c.relrowsecurity as x from pg_class c where c.relnamespace = 'public'::regnamespace
      union all select 'a:' || attrelid::regclass || '.' || attname from pg_attribute where attrelid in (select oid from pg_class where relnamespace = 'public'::regnamespace) and attnum > 0 and not attisdropped
      union all select 'p:' || oid::regprocedure || ':' || coalesce(proacl::text, '') from pg_proc where pronamespace = 'public'::regnamespace
      union all select 'k:' || conname || ':' || pg_get_constraintdef(oid) from pg_constraint where connamespace = 'public'::regnamespace
      union all select 'y:' || polname || ':' || polcmd::text from pg_policy
      union all select 't:' || tgname from pg_trigger where not tgisinternal
      union all select 'd:' || defaclrole::regrole::text || ':' || defaclobjtype::text || ':' || defaclacl::text from pg_default_acl
      union all select 'r:' || count(*) from public.reservations
    ) t;`)
}
