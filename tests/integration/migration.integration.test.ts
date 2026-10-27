import { beforeAll, describe, expect, it } from 'vitest'
import {
  MIGRATION,
  MIGRATION_2,
  ROLLBACK,
  ROLLBACK_2,
  TEARDOWN,
  madridDate,
  migrate,
  migrateAll,
  precheck,
  psql,
  psqlError,
  rebuildFromSnapshot,
  rows,
  schemaFingerprint,
  sqlFile,
} from './localDb'

// LOCAL STACK ONLY. This suite replaces the local `public` schema with the captured hosted
// snapshot and replays the migration lifecycle on it. It always ends with the migration
// applied, which the other integration suites rely on.

const LEGACY = `
  insert into public.reservations (id, guest_name, phone, reservation_date, reservation_time, party_size, seating_preference, preferred_language, notes, status, created_at, updated_at)
  values
    ('00000000-0000-4000-8000-000000000001', 'Legacy Spaced Phone', '600 11 22 33', '2030-01-05', '13:00', 120, 'terrace', 'en', 'Booked by phone in 2025', 'confirmed', '2025-12-01T10:00:00Z', '2025-12-01T10:00:00Z'),
    ('00000000-0000-4000-8000-000000000002', 'Legacy Basque', '+34600123456', '2030-02-01', '20:30', 6, 'indoor', 'eu', null, 'pending', '2025-12-02T10:00:00Z', '2025-12-02T10:00:00Z');`

const LEGACY_COLUMNS = 'id, guest_name, phone, reservation_date, reservation_time, party_size, seating_preference, preferred_language, notes, status, created_at, updated_at'
const legacyRows = () => psql(`select ${LEGACY_COLUMNS} from public.reservations where id::text like '00000000-0000-4000-8000-%' order by id;`)

const results = (checks: string[][]) => Object.fromEntries(checks.map(([n, , result]) => [n, result]))
const stops = (checks: string[][]) => checks.filter(([, , result]) => result === 'STOP').map(([n, name, , found]) => `${n} ${name}: ${found}`)

const exists = {
  validateTrigger: () => psql(`select count(*) from pg_trigger where tgname = 'reservations_validate_new';`) === '1',
  staffFunction: () => psql(`select count(*) from pg_proc where proname = 'staff_set_reservation_status';`) === '1',
  referenceColumn: () => psql(`select count(*) from information_schema.columns where table_name = 'reservations' and column_name = 'reference';`) === '1',
}

const accessSummary = () =>
  psql(`select
    has_table_privilege('anon', 'public.reservations', 'select,insert,update,delete'),
    has_table_privilege('authenticated', 'public.reservations', 'insert,update,delete'),
    has_function_privilege('anon', 'public.is_current_user_staff()', 'execute'),
    (select string_agg(polname, ',' order by polname) from pg_policy where polrelid = 'public.reservations'::regclass);`)

describe('hosted precheck', () => {
  beforeAll(() => rebuildFromSnapshot())

  it('reports no STOP on the captured hosted schema and only expected REVIEW rows', () => {
    psql(LEGACY)
    const checks = precheck()
    expect(checks).toHaveLength(22)
    expect(stops(checks)).toEqual([])
    // The legacy rows deliberately break the new-row rules; the local stack has no staff yet.
    expect(Object.entries(results(checks)).filter(([, r]) => r !== 'OK').map(([n]) => n).sort()).toEqual(['20', '21', '22'])
  })

  it('is read-only: it changes no schema object, privilege or row', () => {
    const before = schemaFingerprint()
    precheck()
    expect(schemaFingerprint()).toBe(before)
  })

  it('runs in a read-only transaction that refuses writes', () => {
    const readOnly = sqlFile('supabase/drafts/hosted-precheck.sql').replace(/\nrollback;\s*$/, "\ninsert into public.staff_users (user_id) values (gen_random_uuid());\nrollback;\n")
    expect(psqlError(readOnly)).toMatch(/read-only transaction/)
  })
})

describe('migration on the captured hosted schema', () => {
  let legacyBefore: string

  beforeAll(() => {
    rebuildFromSnapshot()
    psql(LEGACY)
    legacyBefore = legacyRows()
  })

  it('is atomic: a failure part-way leaves the schema untouched', () => {
    const before = schemaFingerprint()
    const failing = sqlFile(MIGRATION).replace(/\ncommit;\s*$/, '\nselect 1 / 0;\ncommit;\n')
    expect(psqlError(failing)).toMatch(/division by zero/)
    expect(schemaFingerprint()).toBe(before)
    expect(exists.referenceColumn()).toBe(false)
  })

  it('applies cleanly and preserves every existing value', () => {
    migrate()
    expect(legacyRows()).toBe(legacyBefore)
    expect(
      rows(psql(`select reference ~ '^IT-[0-9A-F]{8}$', source is null, created_by is null, request_id is null from public.reservations where id::text like '00000000-0000-4000-8000-%' order by id;`)),
    ).toEqual([
      ['t', 't', 't', 't'],
      ['t', 't', 't', 't'],
    ])
  })

  it('keeps legacy rows that break the new-row rules editable, and maintains updated_at', () => {
    const out = psql(`update public.reservations set status = 'cancelled' where id = '00000000-0000-4000-8000-000000000001' returning status, updated_at > '2025-12-01T10:00:00Z';`)
    expect(out).toBe('cancelled\tt')
    expect(psql(`select party_size, phone from public.reservations where id = '00000000-0000-4000-8000-000000000001';`)).toBe('120\t600 11 22 33')
  })

  it('accepts all five languages and enforces the new-row rules', () => {
    for (const lang of ['eu', 'es', 'fr', 'en', 'de']) {
      expect(psql(`insert into public.reservations (guest_name, phone, reservation_date, reservation_time, party_size, preferred_language) values ('Lang ${lang}', '+34600000001', '2030-03-01', '13:00', 2, '${lang}') returning preferred_language, source, status;`)).toBe(`${lang}\twebsite\tpending`)
    }
    const insert = (overrides: string) =>
      `insert into public.reservations (guest_name, phone, reservation_date, reservation_time, party_size, preferred_language, status, source, created_by) values (${overrides});`
    expect(psqlError(insert(`'Bad Lang', '+34600000001', '2030-03-01', '13:00', 2, 'it', 'pending', 'website', null`))).toMatch(/reservations_preferred_language/)
    expect(psqlError(insert(`'Bad Phone', '600 11 22 33', '2030-03-01', '13:00', 2, 'es', 'pending', 'website', null`))).toMatch(/phone_format/)
    expect(psqlError(insert(`'Too Many', '+34600000001', '2030-03-01', '13:00', 91, 'es', 'pending', 'website', null`))).toMatch(/party_size_max/)
    expect(psqlError(insert(`'Pre Confirmed', '+34600000001', '2030-03-01', '13:00', 2, 'es', 'confirmed', 'website', null`))).toMatch(/website_requests_start_pending/)
    expect(psqlError(insert(`'No Source', '+34600000001', '2030-03-01', '13:00', 2, 'es', 'pending', null, null`))).toMatch(/source_required/)
    expect(psqlError(insert(`'Fake Phone Booking', '+34600000001', '2030-03-01', '13:00', 2, 'es', 'confirmed', 'phone', gen_random_uuid()`))).toMatch(/phone_booking_requires_active_staff|foreign key/)
  })

  it('can be applied again without changing anything', () => {
    const before = schemaFingerprint()
    migrate()
    expect(schemaFingerprint()).toBe(before)
  })
})

describe('safe rollback', () => {
  beforeAll(() => {
    rebuildFromSnapshot()
    psql(LEGACY)
    migrate()
  })

  it('switches off the new behaviour but keeps data, audit columns and tightened access', () => {
    const references = psql(`select string_agg(reference, ',' order by id) from public.reservations;`)
    const access = accessSummary()
    psql(sqlFile(ROLLBACK))

    expect(exists.validateTrigger()).toBe(false)
    expect(exists.staffFunction()).toBe(false)
    expect(psql(`select string_agg(reference, ',' order by id) from public.reservations;`)).toBe(references)
    expect(psql(`select count(*) from information_schema.columns where table_name = 'reservations' and column_name in ('reference', 'source', 'request_id', 'created_by', 'status_changed_at', 'status_changed_by');`)).toBe('6')
    expect(accessSummary()).toBe(access)
    expect(access).toBe('f\tf\tf\tStaff can read reservations')
    expect(psql(`select has_table_privilege('anon', 'public.rate_limit_events', 'select');`)).toBe('f')
  })

  it('is idempotent and the migration can be re-applied afterwards', () => {
    psql(sqlFile(ROLLBACK))
    migrate()
    expect(exists.validateTrigger()).toBe(true)
    expect(exists.staffFunction()).toBe(true)
  })
})

describe('destructive teardown', () => {
  const confirmed = () => `set iturrieta.confirm_teardown = 'DELETE-AUDIT-DATA';\n${sqlFile(TEARDOWN)}`

  beforeAll(() => {
    rebuildFromSnapshot()
    psql(LEGACY)
    migrate()
  })

  it('refuses to run without explicit confirmation and changes nothing', () => {
    const before = schemaFingerprint()
    expect(psqlError(sqlFile(TEARDOWN))).toMatch(/teardown_not_confirmed/)
    expect(schemaFingerprint()).toBe(before)
  })

  it('refuses while French or German reservations exist', () => {
    psql(`insert into public.reservations (id, guest_name, phone, reservation_date, reservation_time, party_size, preferred_language) values ('00000000-0000-4000-9000-000000000001', 'German Guest', '+34600000002', '2030-04-01', '13:00', 2, 'de');`)
    try {
      const before = schemaFingerprint()
      expect(psqlError(confirmed())).toMatch(/teardown_blocked: reservations in fr\/de exist/)
      expect(schemaFingerprint()).toBe(before)
    } finally {
      psql(`delete from public.reservations where id = '00000000-0000-4000-9000-000000000001';`)
    }
  })

  it('refuses while suspended staff exist, so they cannot regain access', () => {
    const userId = psql(`insert into auth.users (id, email) values (gen_random_uuid(), 'suspended-' || gen_random_uuid() || '@example.test') returning id;`)
    try {
      psql(`insert into public.staff_users (user_id, active) values ('${userId}', false);`)
      expect(psqlError(confirmed())).toMatch(/teardown_blocked: suspended staff accounts exist/)
    } finally {
      psql(`delete from public.staff_users where user_id = '${userId}'; delete from auth.users where id = '${userId}';`)
    }
  })

  it('when confirmed, removes the schema changes but never restores the old permissive access', () => {
    const legacyBefore = legacyRows()
    psql(confirmed())

    expect(exists.referenceColumn()).toBe(false)
    expect(psql(`select pg_get_constraintdef(oid) from pg_constraint where conname = 'reservations_preferred_language';`)).toBe(
      "CHECK ((preferred_language = ANY (ARRAY['es'::text, 'eu'::text, 'en'::text])))",
    )
    expect(legacyRows()).toBe(legacyBefore)
    expect(accessSummary()).toBe('f\tf\tf\tStaff can read reservations')
    expect(psql(`select count(*) from pg_default_acl d, aclexplode(d.defaclacl) a where d.defaclnamespace = 'public'::regnamespace and a.grantee in ('anon'::regrole, 'authenticated'::regrole);`)).toBe('0')
  })

  it('leaves a schema the migration can be applied to again', () => {
    migrate()
    expect(exists.referenceColumn()).toBe(true)
    expect(psql(`select count(*) from public.reservations where reference is null;`)).toBe('0')
  })
})

// Runs last: leaves 0001 + 0002 applied for the other suites.
describe('migration 0002 (availability and tracker)', () => {
  let legacyBefore: string
  let legacyReferences: string

  beforeAll(() => {
    rebuildFromSnapshot()
    psql(LEGACY)
    migrate()
    legacyBefore = legacyRows()
    legacyReferences = psql(`select string_agg(reference, ',' order by id) from public.reservations;`)
  })

  it('is atomic: a failure part-way leaves the schema untouched', () => {
    const before = schemaFingerprint()
    expect(psqlError(sqlFile(MIGRATION_2).replace(/\ncommit;\s*$/, '\nselect 1 / 0;\ncommit;\n'))).toMatch(/division by zero/)
    expect(schemaFingerprint()).toBe(before)
  })

  it('applies on top of 0001, keeps every existing value and reference, and is idempotent', () => {
    psql(sqlFile(MIGRATION_2))
    expect(legacyRows()).toBe(legacyBefore)
    expect(psql(`select string_agg(reference, ',' order by id) from public.reservations;`)).toBe(legacyReferences)
    const before = schemaFingerprint()
    psql(sqlFile(MIGRATION_2))
    expect(schemaFingerprint()).toBe(before)
    expect(psql(`select capacity, max_party_size, verified_by_venue from public.booking_settings;`)).toBe('90\t90\tf')
  })

  it('gives new reservations a 12-character unpredictable reference', () => {
    const date = madridDate(20)
    const ref = psql(`insert into public.reservations (guest_name, phone, reservation_date, reservation_time, party_size, preferred_language) values ('New Ref', '+34600000003', '${date}', '20:30', 2, 'es') returning reference;`)
    expect(ref).toMatch(/^IT-[0-9A-F]{12}$/)
  })

  it('safe rollback removes only the new functions; re-applying 0001 then 0002 restores everything', () => {
    psql(sqlFile(ROLLBACK_2))
    expect(psql(`select count(*) from pg_proc where proname in ('get_availability', 'create_website_reservation', 'lookup_reservation', 'seats_held');`)).toBe('0')
    expect(legacyRows()).toBe(legacyBefore)
    expect(psql(`select count(*) from public.booking_slots;`)).toBe('49')
    psql(sqlFile(ROLLBACK_2))
    migrate()
    expect(psql(`select has_table_privilege('service_role', 'public.reservations', 'insert');`)).toBe('t')
    migrateAll()
    expect(psql(`select count(*) from pg_proc where proname in ('get_availability', 'create_website_reservation', 'lookup_reservation', 'seats_held');`)).toBe('4')
    expect(psql(`select has_table_privilege('service_role', 'public.reservations', 'insert');`)).toBe('f')
    expect(legacyRows()).toBe(legacyBefore)
  })
})
