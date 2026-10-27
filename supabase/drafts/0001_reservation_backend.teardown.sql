-- =============================================================================
-- DESTRUCTIVE TEARDOWN of 0001_reservation_backend.sql — separate review required.
--
-- PERMANENTLY DELETES DATA. Not part of normal recovery: use the safe rollback
-- (0001_reservation_backend.rollback.sql) or a forward-fix migration instead.
-- Take and verify a backup first.
--
-- What is lost:
--   * reservations.reference   — guests' and staff's booking references;
--   * reservations.source / created_by / request_id / status_changed_at / status_changed_by
--     — who entered phone bookings, who changed each status and when, idempotency keys;
--   * staff_users.active       — which staff accounts are suspended;
--   * rate_limit_events        — hashed abuse counters.
--
-- What it refuses to do (fails, changing nothing):
--   * run without the explicit confirmation setting below;
--   * run while any reservation uses 'fr' or 'de' (the three-language constraint would
--     reject them; decide what to do with those rows first);
--   * run while any staff account is suspended (dropping `active` would silently give
--     those accounts staff access again; delete their staff_users rows first).
--
-- What it never does: restore the original GRANT ALL to anon/authenticated, the staff
-- DELETE/UPDATE policies, anon EXECUTE on is_current_user_staff() or the permissive
-- default privileges. Those weakened security and are intentionally not scripted.
--
-- To run, uncomment the next line in the same session (it must precede `begin`):
-- set iturrieta.confirm_teardown = 'DELETE-AUDIT-DATA';
-- =============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
begin
  if coalesce(current_setting('iturrieta.confirm_teardown', true), '') <> 'DELETE-AUDIT-DATA' then
    raise exception 'teardown_not_confirmed: set iturrieta.confirm_teardown first';
  end if;
  if exists (select 1 from public.reservations where preferred_language in ('fr', 'de')) then
    raise exception 'teardown_blocked: reservations in fr/de exist';
  end if;
  if exists (select 1 from public.staff_users where not active) then
    raise exception 'teardown_blocked: suspended staff accounts exist';
  end if;
end;
$$;

drop trigger if exists reservations_validate_new on public.reservations;
drop trigger if exists reservations_touch_updated_at on public.reservations;
drop function if exists public.reservations_validate_new();
drop function if exists public.touch_updated_at();
drop function if exists public.staff_set_reservation_status(uuid, text);
drop function if exists public.staff_create_phone_reservation(text, text, date, time, integer, text, text, text, text);
drop function if exists public.consume_rate_limit(text, integer, integer);
drop table if exists public.rate_limit_events;

alter table public.reservations
  drop constraint if exists reservations_source_creator,
  drop constraint if exists reservations_source,
  drop constraint if exists reservations_preferred_language,
  add constraint reservations_preferred_language check (preferred_language in ('es', 'eu', 'en'));

drop index if exists public.reservations_created_at_idx;
drop index if exists public.reservations_request_id_key;
drop index if exists public.reservations_reference_key;

alter table public.reservations
  drop column if exists status_changed_by,
  drop column if exists status_changed_at,
  drop column if exists created_by,
  drop column if exists request_id,
  drop column if exists source,
  drop column if exists reference;

-- Same body as the snapshot. CREATE OR REPLACE keeps the current (tightened) EXECUTE grants.
create or replace function public.is_current_user_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_users where user_id = (select auth.uid()));
$$;

alter table public.staff_users drop column if exists active;

commit;
