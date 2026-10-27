# Database

Migrations 0001 and 0002 were applied to the hosted project `gytuoplvnlcjwsypdrxg` on
2026-10-27 after a 22/22 OK precheck (see `docs/DEPLOYMENT.md`, "Status"). They are not yet
recorded in `supabase/migrations/` or the migration history. Every hosted step needs
explicit authorization from the project owner.

## The captured hosted schema

`supabase/snapshots/remote_public_schema.sql` is the project owner's schema-only capture of
the hosted `public` schema (no row data, no credentials). The hosted database can change
after a capture, so `supabase/drafts/hosted-precheck.sql` re-verifies it immediately before
any migration.

Findings from the snapshot:

| Area | Hosted (snapshot) | Problem |
|---|---|---|
| Languages | `preferred_language` in es, eu, en | French and German requests are rejected |
| Hard delete | Policy "Staff can delete reservations" | Reservations must never be hard-deleted |
| Updates | Policy "Staff can update reservations" (any column) | Bypasses the status-transition rules |
| Table grants | `GRANT ALL` to `anon`, `authenticated`, `service_role` on both tables | Only RLS stands between anon and the data |
| Function grants | `is_current_user_staff()` executable by `anon` | Unnecessary exposure |
| Default privileges | Future tables, sequences and functions in `public` get `ALL` for `anon` and `authenticated` | Any new object is exposed unless revoked |
| Staff suspension | Not possible | A compromised staff account can only be deleted |
| Provenance | No source, creator, reference or request id | Phone bookings not attributable; no idempotency |
| `updated_at` | Default only | Never changes on update |

## Files

| File | Kind | Purpose |
|---|---|---|
| `supabase/drafts/hosted-precheck.sql` | Read-only | One checklist query (OK / REVIEW / STOP) |
| `supabase/drafts/0001_reservation_backend.sql` | Migration | Atomic, idempotent; `[ADDITIVE]` and `[TIGHTENING]` sections |
| `supabase/drafts/0001_reservation_backend.rollback.sql` | Safe rollback | Switches the new behaviour off; no data loss, no access reopened |
| `supabase/drafts/0001_reservation_backend.teardown.sql` | **Destructive** | Removes the schema changes and their data; separate review and explicit confirmation |

All four live outside `supabase/migrations/` so nothing can push them by accident.

## What the migration changes

It runs in one transaction (`lock_timeout` 5 s, `statement_timeout` 60 s); any error leaves
the schema exactly as it was. Every statement is idempotent, so it can be re-applied.

**Tables and columns (additive)**
- `staff_users.active boolean not null default true` — existing staff stay active.
- `reservations`: `reference` (unique, `IT-XXXXXXXX`), `source`, `request_id` (unique),
  `created_by`, `status_changed_at`, `status_changed_by`. `created_by`/`status_changed_by`
  reference `auth.users`, so a staff account that entered or changed bookings cannot be
  deleted — suspend it with `active = false` instead.
- `rate_limit_events (bucket, created_at)`: 64-character hashes only; indexes on
  `(bucket, created_at)` and `(created_at)` for cleanup; RLS on, no grants to API roles.

**Existing rows.** No existing value is changed. Existing rows receive a new `reference`
(needed by guests and the staff UI) and keep `source = NULL`, meaning "recorded before this
migration, origin unknown" — they are not relabelled as website requests. The staff UI shows
them as "Origin not recorded" (in Basque and Spanish: "Jatorria erregistratu gabe",
"Origen sin registrar").

**Constraints**
- `reservations_preferred_language`: eu, es, fr, en, de (every existing value still passes).
- `reservations_source`: website or phone (NULL allowed for legacy rows).
- `reservations_source_creator`: phone ⇔ `created_by` set (NULL source passes).
- All existing snapshot constraints are kept (name 2–100, notes ≤ 1000, phone 5–30 chars,
  party ≥ 1, seating, status).

**Triggers**
- `reservations_validate_new` (BEFORE INSERT, SECURITY DEFINER): `source` required; website
  rows must start `pending`; phone rows need an **active staff** `created_by`; phone format
  `^\+?[0-9]{7,15}$`; party ≤ 90. Insert-only on purpose: CHECK constraints (even
  `NOT VALID`) are re-checked on every UPDATE and would make legacy rows that break them
  impossible to confirm or cancel.
- `reservations_touch_updated_at` (BEFORE UPDATE): `updated_at = now()`.

**Functions** (all `SECURITY DEFINER`, `search_path = ''`)
- `is_current_user_staff()`: now also requires `active`.
- `staff_set_reservation_status(id, status)`: staff only; NULL id or status → `22004`;
  locks the row; allows pending → confirmed/rejected/cancelled and confirmed → cancelled
  only (`22023` otherwise); records `status_changed_at/by`.
- `staff_create_phone_reservation(...)`: staff only; NULL status → `22004`; initial status
  pending or confirmed; sets `source = 'phone'` and `created_by = auth.uid()`.
- `consume_rate_limit(bucket, limit, window)`: prunes events older than a day, counts, inserts.

**Policies (tightening).** The staff DELETE and UPDATE policies are dropped; only
"Staff can read reservations" remains.

**Grants (tightening).** Everything is revoked from `PUBLIC`, `anon`, `authenticated` and
`service_role`, then only what the code uses is granted:

| Object | anon | authenticated (staff UI) | service_role (Edge Function) |
|---|---|---|---|
| `reservations` | — | SELECT (rows via RLS) | SELECT, INSERT (0002 removes INSERT: writes go through `create_website_reservation`) |
| `staff_users`, `rate_limit_events` | — | — | — |
| `is_current_user_staff()` | — | EXECUTE (used by the RLS policy) | — |
| `staff_set_reservation_status`, `staff_create_phone_reservation` | — | EXECUTE | — |
| `consume_rate_limit` | — | — | EXECUTE |
| trigger functions | — | — | — |

Nobody holding an API key can UPDATE, DELETE or TRUNCATE reservations or write
`staff_users`. Staff membership is administered by the database owner (SQL editor).

**Default privileges (tightening).** For objects `postgres` creates later in `public`, ALL
on tables, sequences and functions is revoked from `anon` and `authenticated`;
`service_role` keeps its defaults. Consequence: any future table or function must be granted
explicitly. Limitation (demonstrated by the local tests): PostgreSQL grants `EXECUTE` on
every new function to `PUBLIC` (which includes `anon`), and that built-in default can only
be removed globally for all schemas, which this migration does not do. Every future function
must therefore `revoke execute ... from public` explicitly.

## Migration 0002: availability, overbooking protection and the booking tracker

`supabase/drafts/0002_availability_and_tracker.sql` (atomic, idempotent; requires 0001).
Safe rollback: `0002_availability_and_tracker.rollback.sql`, then re-apply 0001.

**Business rules (configuration, not code).** Stored in `public.booking_settings`
(one row), `public.booking_slots` (weekday × time) and `public.booking_closures` (dates).
Only the capacity is an official fact; everything else is a **placeholder that the venue
must confirm** (`verified_by_venue = false`):

| Setting | Value | Source |
|---|---|---|
| `capacity`, `max_party_size` | 90 | Official site: "capacidad para 90 comensales" |
| `duration_minutes` | 120 | Placeholder |
| `min_lead_minutes` | 60 | Placeholder |
| `max_advance_days` | 180 | Placeholder |
| Slots | 13:00, 13:30, 14:00, 14:30, 20:30, 21:00, 21:30, every day | Placeholder |
| Closures | none | To be entered by the venue |

**Capacity policy.** `pending` and `confirmed` hold seats; `rejected` and `cancelled`
release them immediately. A reservation occupies its seats from its start for
`duration_minutes`; a new request fits when the seats of every overlapping reservation
plus its party stay within `capacity` (conservative: it never under-counts). Indoor/terrace
is a preference only — there is one shared capacity and no per-area allocation, so the UI
never promises an area. Lowering the capacity affects new requests only.

**Atomicity.** `create_website_reservation()` (the only write path for website requests;
the service role no longer has INSERT on `reservations`) and
`staff_create_phone_reservation()` both take `pg_advisory_xact_lock` on one key before the
capacity check and insert, so concurrent requests are decided one at a time inside their
transactions. Verified locally: 25 simultaneous one-seat requests against capacity 10 →
exactly 10 accepted; 9 simultaneous requests through the Edge Function against capacity 4
→ exactly 4 accepted.

**Functions and access**

| Function | Who may call | Returns |
|---|---|---|
| `get_availability(date, party)` | anon, authenticated, service_role | Slot times and a yes/no flag only |
| `create_website_reservation(...)` | service_role (Edge Function) | reference, status (`pending`), replayed |
| `lookup_reservation(reference, phone)` | service_role (Edge Function) | reference, date, time, party size, status — only if reference **and** phone match |
| `seats_held(...)` | nobody (internal) | — |

Staff phone bookings respect the same capacity but not the public slot list (dinners and
groups are arranged by phone). New references have 12 hex characters (48 random bits);
existing references are kept.

## Recovery: forward fix, safe rollback, teardown

1. **Forward fix (preferred).** If one function or trigger misbehaves, write a new reviewed
   migration that corrects it. Nothing is lost and access stays tight.
2. **Safe rollback** (`...rollback.sql`), when the new behaviour must be switched off now.
   Atomic and idempotent. Drops the two triggers, the trigger functions, the staff functions
   and `consume_rate_limit`. Keeps all rows and columns, `active`, the five-language
   constraint, the dropped policies, the revoked grants and the tightened default
   privileges. Afterwards the public form fails closed (the site shows the phone/WhatsApp
   fallback) and staff can read but not change reservations. Re-applying the migration
   restores everything.
3. **Destructive teardown** (`...teardown.sql`), separate review only. Permanently deletes
   `reference`, `source`, `created_by`, `request_id`, `status_changed_*`, `active` and the
   rate-limit table, and restores the three-language constraint. It refuses to run (changing
   nothing) without `set iturrieta.confirm_teardown = 'DELETE-AUDIT-DATA'`, while any
   reservation is in fr/de, or while any staff account is suspended (dropping `active`
   would give them access again).

None of these restores the original `GRANT ALL`, the staff DELETE/UPDATE policies, anon
EXECUTE on `is_current_user_staff()` or the permissive default privileges. A fully lossless
reversal is not possible: once guests and staff rely on references and audit columns,
removing them loses information. The only lossless way back to the pre-migration state is
restoring the backup taken before the migration (which also discards later reservations).

## Precheck: how to read it

Run the whole file in the SQL editor as `postgres`. It opens a `READ ONLY` transaction,
returns one table (`n | check | result | found | expected`) and rolls back. It returns no
customer details or staff emails, only counts and object names.

| Result | Meaning |
|---|---|
| OK | Matches the snapshot |
| REVIEW | Read `found`; continue only if the difference is understood (e.g. legacy rows breaking the new-row rules, extra indexes, other default-privilege owners, no staff rows yet) |
| STOP | Do not migrate: wrong session role or table owner, columns/constraints/policies differ from the snapshot, unexpected language/status values, RLS off, PUBLIC table grants, `is_current_user_staff()` missing, or objects the migration creates already exist |

On the local copy of the snapshot (with two legacy rows and no staff), checks 1–19 are OK
and 20–22 are REVIEW, as expected.

## Verification (local stack only)

`npm run test:integration` runs four suites against the local Docker stack:

- `migration` — rebuilds local `public` from the snapshot, then: precheck has no STOP and
  changes nothing (schema fingerprint) and refuses writes; a failure injected before
  `commit` leaves the schema untouched; legacy rows keep every value, get a reference,
  keep `source = NULL` and stay editable; all five languages and every new-row rule;
  re-applying changes nothing; safe rollback keeps data and access, then re-apply; teardown
  refuses without confirmation, with fr/de rows and with suspended staff, and when
  confirmed never restores permissive access; the migration re-applies afterwards.
- `privileges` — the exact grant matrix above, RLS on every table, only the read policy,
  no function executable through PUBLIC, default privileges probed with a new table,
  sequence and function, and the service role's real API behaviour.
- `staffAccess`, `createReservation` — Auth, RLS, transitions (incl. NULL inputs),
  phone bookings, the Edge Function, idempotency and rate limiting.

These run only against `127.0.0.1`. They prove the SQL against the captured snapshot, not
against the hosted database.

## Applying to the hosted project (requires explicit authorization)

1. Take a backup (Dashboard → Database → Backups) and note its time.
2. Run `hosted-precheck.sql`. Any STOP: stop. Any REVIEW: resolve or accept in writing.
3. Run `0001_reservation_backend.sql`, then `0002_availability_and_tracker.sql`, each as one
   script (each contains its own `begin`/`commit`). Then have the venue confirm or edit the
   placeholder rows in `booking_settings` / `booking_slots` and set `verified_by_venue = true`.
4. Re-run the precheck as a post-check. It now reports STOP/REVIEW by design, because the
   schema no longer matches the snapshot; confirm the `found` values instead: check 3 lists
   the six new columns, check 8 the five languages are accepted, check 11 shows
   `authenticated=SELECT` and `service_role=INSERT,SELECT` on reservations and nothing for
   anon, check 12 shows only `authenticated, postgres`, check 15 shows no anon/authenticated
   defaults, check 16 only the read policy, and check 19 the new objects.
5. Create or verify staff rows (`insert into public.staff_users (user_id) values ('<auth user id>')`).
6. Record the migration in `supabase/migrations/` and the migration history only through a
   process the project owner authorizes.
