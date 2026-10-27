import { randomBytes } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { psql, rows } from './localDb'
import { readLocalStack, rest, type LocalStack } from './localStack'

// LOCAL STACK ONLY. Asserts the privileges the migration leaves behind, from the catalog
// and through the real API gateway.

let stack: LocalStack
beforeAll(() => {
  stack = readLocalStack()
})

const ROLES = ['anon', 'authenticated', 'service_role'] as const
const TABLE_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] as const

function tablePrivileges(table: string) {
  const out = psql(
    ROLES.map((role) => `select '${role}', ${TABLE_PRIVILEGES.map((p) => `has_table_privilege('${role}', 'public.${table}', '${p}')`).join(', ')};`).join('\n'),
  )
  return Object.fromEntries(
    rows(out).map(([role, ...flags]) => [role, TABLE_PRIVILEGES.filter((_, i) => flags[i] === 't')]),
  )
}

function canExecute(signature: string) {
  const out = psql(`select ${ROLES.map((role) => `has_function_privilege('${role}', 'public.${signature}', 'execute')`).join(', ')};`)
  return Object.fromEntries(ROLES.map((role, i) => [role, out.split('\t')[i] === 't']))
}

describe('table privileges', () => {
  it('reservations: staff read through RLS, the service role only reads; all writes go through functions', () => {
    expect(tablePrivileges('reservations')).toEqual({ anon: [], authenticated: ['SELECT'], service_role: ['SELECT'] })
  })

  it.each(['staff_users', 'rate_limit_events', 'booking_settings', 'booking_slots', 'booking_closures'])('%s: no API role has any access', (table) => {
    expect(tablePrivileges(table)).toEqual({ anon: [], authenticated: [], service_role: [] })
  })

  it('row level security stays enabled on every table', () => {
    expect(psql(`select string_agg(relname || '=' || relrowsecurity, ',' order by relname) from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';`)).toBe(
      'booking_closures=true,booking_settings=true,booking_slots=true,rate_limit_events=true,reservations=true,staff_users=true',
    )
  })

  it('only the staff read policy remains', () => {
    expect(psql(`select string_agg(polname || ':' || polcmd::text, ',' order by polname) from pg_policy where polrelid = 'public.reservations'::regclass;`)).toBe('Staff can read reservations:r')
  })
})

describe('function privileges', () => {
  it.each([
    ['is_current_user_staff()', { anon: false, authenticated: true, service_role: false }],
    ['staff_set_reservation_status(uuid, text)', { anon: false, authenticated: true, service_role: false }],
    ['staff_create_phone_reservation(text, text, date, time, integer, text, text, text, text)', { anon: false, authenticated: true, service_role: false }],
    ['consume_rate_limit(text, integer, integer)', { anon: false, authenticated: false, service_role: true }],
    ['reservations_validate_new()', { anon: false, authenticated: false, service_role: false }],
    ['touch_updated_at()', { anon: false, authenticated: false, service_role: false }],
    ['get_availability(date, integer)', { anon: true, authenticated: true, service_role: true }],
    ['create_website_reservation(uuid, text, text, date, time, integer, text, text, text)', { anon: false, authenticated: false, service_role: true }],
    ['lookup_reservation(text, text)', { anon: false, authenticated: false, service_role: true }],
    ['seats_held(timestamp, integer)', { anon: false, authenticated: false, service_role: false }],
  ])('%s', (signature, expected) => {
    expect(canExecute(signature)).toEqual(expected)
  })

  it('no function in public is executable through PUBLIC', () => {
    expect(
      psql(`select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0));`),
    ).toBe('0')
  })
})

describe('default privileges for objects created later in public', () => {
  it('new tables and sequences are not granted to anon or authenticated; service_role keeps its default', () => {
    const out = psql(`
      begin;
      create table public.zz_probe (id serial primary key);
      select has_table_privilege('anon', 'public.zz_probe', 'select'),
             has_table_privilege('authenticated', 'public.zz_probe', 'select'),
             has_table_privilege('service_role', 'public.zz_probe', 'select'),
             has_sequence_privilege('anon', 'public.zz_probe_id_seq', 'usage'),
             has_sequence_privilege('authenticated', 'public.zz_probe_id_seq', 'usage');
      rollback;`)
    expect(out).toBe('f\tf\tt\tf\tf')
  })

  it('new functions are not granted to anon or authenticated explicitly, but PostgreSQL still grants PUBLIC', () => {
    // Documented limitation: the built-in PUBLIC EXECUTE default can only be removed
    // globally, so every new function must `revoke execute ... from public` itself.
    const out = psql(`
      begin;
      create function public.zz_probe_fn() returns int language sql as 'select 1';
      select (select count(*) from aclexplode((select proacl from pg_proc where proname = 'zz_probe_fn')) a
               where a.grantee in ('anon'::regrole, 'authenticated'::regrole)),
             has_function_privilege('anon', 'public.zz_probe_fn()', 'execute');
      revoke execute on function public.zz_probe_fn() from public;
      select has_function_privilege('anon', 'public.zz_probe_fn()', 'execute'),
             has_function_privilege('authenticated', 'public.zz_probe_fn()', 'execute');
      rollback;`)
    expect(out).toBe('0\tt\nf\tf')
  })
})

describe('service role (Edge Function key) through the API', () => {
  const reservation = (overrides: Record<string, unknown> = {}) =>
    JSON.stringify({ guest_name: 'Service Probe', phone: '+34600999888', reservation_date: '2031-07-01', reservation_time: '13:00', party_size: 2, preferred_language: 'es', ...overrides })

  // Since 0002, website requests are written only by create_website_reservation (capacity
  // check + insert in one locked transaction). The insert trigger's own rules are tested
  // as the database owner in the migration suite.
  it('cannot insert any reservation directly, whatever its status or source', async () => {
    for (const overrides of [{}, { status: 'confirmed' }, { source: 'phone', status: 'confirmed' }]) {
      expect((await rest(stack, 'reservations', stack.serviceRoleKey, { method: 'POST', body: reservation(overrides) })).body).toMatchObject({ code: '42501' })
    }
  })

  it('cannot update, delete or touch staff membership', async () => {
    expect((await rest(stack, 'reservations?id=not.is.null', stack.serviceRoleKey, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) })).body).toMatchObject({ code: '42501' })
    expect((await rest(stack, 'reservations?id=not.is.null', stack.serviceRoleKey, { method: 'DELETE' })).body).toMatchObject({ code: '42501' })
    expect((await rest(stack, 'staff_users?select=user_id', stack.serviceRoleKey)).body).toMatchObject({ code: '42501' })
  })

  it('can use the rate limiter, which stores only 64-character hashes', async () => {
    const bucket = randomBytes(32).toString('hex')
    const first = await rest(stack, 'rpc/consume_rate_limit', stack.serviceRoleKey, { method: 'POST', body: JSON.stringify({ p_bucket: bucket, p_limit: 1, p_window_seconds: 60 }) })
    const second = await rest(stack, 'rpc/consume_rate_limit', stack.serviceRoleKey, { method: 'POST', body: JSON.stringify({ p_bucket: bucket, p_limit: 1, p_window_seconds: 60 }) })
    expect([first.body, second.body]).toEqual([true, false])
    const raw = await rest(stack, 'rpc/consume_rate_limit', stack.serviceRoleKey, { method: 'POST', body: JSON.stringify({ p_bucket: '203.0.113.7', p_limit: 5, p_window_seconds: 60 }) })
    expect(raw.body).toMatchObject({ code: '23514' })
    expect(psql(`select count(*) from public.rate_limit_events where bucket !~ '^[0-9a-f]{64}$';`)).toBe('0')
  })
})
