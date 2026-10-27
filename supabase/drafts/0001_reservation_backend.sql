-- =============================================================================
-- DRAFT migration — NOT applied to the hosted project. Requires explicit authorization.
--
-- Written against supabase/snapshots/remote_public_schema.sql. Run
-- supabase/drafts/hosted-precheck.sql first and stop on any STOP row.
-- Must run as `postgres` (the owner of the tables and of the default privileges).
--
-- Atomic: everything happens in one transaction; any error rolls the whole file back.
-- Re-runnable: every statement is idempotent, so it can be applied again after the
-- safe rollback (0001_reservation_backend.rollback.sql).
--
-- [ADDITIVE]   only adds objects or widens what is accepted.
-- [TIGHTENING] removes privileges; needs separate sign-off. It changes behaviour for
--              existing clients: staff lose direct UPDATE/DELETE, and new tables in
--              `public` are no longer automatically granted to anon/authenticated.
--
-- Existing rows: no existing value is changed. Two new columns are filled for them:
--   * reference — a new random IT-XXXXXXXX code (needed by the staff UI and guests);
--   * source    — left NULL, meaning "recorded before this migration, origin unknown".
-- =============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- [ADDITIVE] Staff membership can be suspended without deleting the account -------
alter table public.staff_users
  add column if not exists active boolean not null default true;

create or replace function public.is_current_user_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_users s
    where s.user_id = (select auth.uid()) and s.active
  );
$$;

-- [ADDITIVE] Reservation provenance, idempotency and audit columns ------------------
alter table public.reservations
  add column if not exists reference text,
  add column if not exists source text,
  add column if not exists request_id uuid,
  add column if not exists created_by uuid references auth.users (id),
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_changed_by uuid references auth.users (id);

-- Only new rows get a source by default; existing rows keep NULL (origin unknown).
alter table public.reservations alter column source set default 'website';

update public.reservations
   set reference = 'IT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
 where reference is null;

alter table public.reservations
  alter column reference set default ('IT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  alter column reference set not null;

create unique index if not exists reservations_reference_key on public.reservations (reference);
create unique index if not exists reservations_request_id_key on public.reservations (request_id);
create index if not exists reservations_created_at_idx on public.reservations (created_at desc);

-- NULL passes both checks, so legacy rows (source NULL, created_by NULL) remain valid.
alter table public.reservations
  drop constraint if exists reservations_source,
  add constraint reservations_source check (source in ('website', 'phone')),
  drop constraint if exists reservations_source_creator,
  add constraint reservations_source_creator check ((source = 'phone') = (created_by is not null));

-- [ADDITIVE] Accept all five site languages (was es/eu/en) --------------------------
alter table public.reservations
  drop constraint if exists reservations_preferred_language,
  add constraint reservations_preferred_language check (preferred_language in ('eu', 'es', 'fr', 'en', 'de'));

-- [ADDITIVE] Rules for NEW rows only. CHECK constraints (even NOT VALID) are re-checked on
-- every UPDATE, which would make legacy rows that break them impossible to confirm or
-- cancel. SECURITY DEFINER so the staff lookup works whoever inserts (the Edge Function's
-- service role has no access to staff_users).
create or replace function public.reservations_validate_new() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.source is null then
    raise exception 'source_required' using errcode = '23514';
  end if;
  if new.source = 'website' and new.status <> 'pending' then
    raise exception 'website_requests_start_pending' using errcode = '23514';
  end if;
  if new.source = 'phone' and not exists (
    select 1 from public.staff_users s where s.user_id = new.created_by and s.active
  ) then
    raise exception 'phone_booking_requires_active_staff' using errcode = '23514';
  end if;
  if new.phone !~ '^\+?[0-9]{7,15}$' then
    raise exception 'phone_format' using errcode = '23514';
  end if;
  if new.party_size > 90 then
    raise exception 'party_size_max' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_validate_new on public.reservations;
create trigger reservations_validate_new
  before insert on public.reservations
  for each row execute function public.reservations_validate_new();

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reservations_touch_updated_at on public.reservations;
create trigger reservations_touch_updated_at
  before update on public.reservations
  for each row execute function public.touch_updated_at();

-- [ADDITIVE] Abuse protection for the public Edge Function: salted hashes only ------
create table if not exists public.rate_limit_events (
  bucket text not null check (char_length(bucket) = 64),
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_events_bucket_idx on public.rate_limit_events (bucket, created_at);
create index if not exists rate_limit_events_created_at_idx on public.rate_limit_events (created_at);
alter table public.rate_limit_events enable row level security;

create or replace function public.consume_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  recent integer;
begin
  delete from public.rate_limit_events where created_at < now() - interval '1 day';
  select count(*) into recent from public.rate_limit_events
   where bucket = p_bucket and created_at > now() - make_interval(secs => p_window_seconds);
  if recent >= p_limit then
    return false;
  end if;
  insert into public.rate_limit_events (bucket) values (p_bucket);
  return true;
end;
$$;

-- [ADDITIVE] Staff operations: the only write paths available to signed-in users ----
create or replace function public.staff_set_reservation_status(p_reservation_id uuid, p_status text)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  current_status text;
  updated public.reservations;
begin
  if not public.is_current_user_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;
  if p_reservation_id is null then
    raise exception 'reservation_id_required' using errcode = '22004';
  end if;
  if p_status is null then
    raise exception 'status_required' using errcode = '22004';
  end if;

  select r.status into current_status from public.reservations r where r.id = p_reservation_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if not (
    (current_status = 'pending' and p_status in ('confirmed', 'rejected', 'cancelled'))
    or (current_status = 'confirmed' and p_status = 'cancelled')
  ) then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  update public.reservations r
     set status = p_status, status_changed_at = now(), status_changed_by = (select auth.uid())
   where r.id = p_reservation_id
  returning * into updated;
  return updated;
end;
$$;

create or replace function public.staff_create_phone_reservation(
  p_guest_name text,
  p_phone text,
  p_reservation_date date,
  p_reservation_time time,
  p_party_size integer,
  p_seating_preference text,
  p_preferred_language text,
  p_notes text default null,
  p_status text default 'confirmed'
)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  created public.reservations;
begin
  if not public.is_current_user_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;
  if p_status is null then
    raise exception 'status_required' using errcode = '22004';
  end if;
  if p_status not in ('pending', 'confirmed') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  insert into public.reservations (
    guest_name, phone, reservation_date, reservation_time, party_size,
    seating_preference, preferred_language, notes, status, source, created_by,
    status_changed_at, status_changed_by
  ) values (
    btrim(regexp_replace(p_guest_name, '\s+', ' ', 'g')), p_phone, p_reservation_date, p_reservation_time, p_party_size,
    p_seating_preference, p_preferred_language, nullif(btrim(coalesce(p_notes, '')), ''), p_status, 'phone', (select auth.uid()),
    now(), (select auth.uid())
  )
  returning * into created;
  return created;
end;
$$;

-- [TIGHTENING] No hard delete and no unrestricted updates by staff -----------------
drop policy if exists "Staff can delete reservations" on public.reservations;
drop policy if exists "Staff can update reservations" on public.reservations;

-- [TIGHTENING] Explicit least-privilege grants. Everything is revoked first, then only
-- what the code uses is granted back:
--   authenticated (staff UI): SELECT reservations (rows filtered by RLS), the staff check
--                             used by that RLS policy, and the two staff functions.
--   service_role (create-reservation Edge Function): SELECT + INSERT on reservations
--                             (replay lookup, insert ... returning) and consume_rate_limit.
-- SECURITY DEFINER functions run as their owner, so callers need no table privileges.
revoke all on table public.reservations from public, anon, authenticated, service_role;
revoke all on table public.staff_users from public, anon, authenticated, service_role;
revoke all on table public.rate_limit_events from public, anon, authenticated, service_role;
grant select on table public.reservations to authenticated;
grant select, insert on table public.reservations to service_role;

revoke all on function public.is_current_user_staff() from public, anon, authenticated, service_role;
revoke all on function public.staff_set_reservation_status(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.staff_create_phone_reservation(text, text, date, time, integer, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated, service_role;
revoke all on function public.reservations_validate_new() from public, anon, authenticated, service_role;
revoke all on function public.touch_updated_at() from public, anon, authenticated, service_role;
grant execute on function public.is_current_user_staff() to authenticated;
grant execute on function public.staff_set_reservation_status(uuid, text) to authenticated;
grant execute on function public.staff_create_phone_reservation(text, text, date, time, integer, text, text, text, text) to authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- [TIGHTENING] Default privileges for objects that `postgres` creates in `public` later.
-- The snapshot grants ALL on future tables, sequences and functions to anon and
-- authenticated. After this, new objects must be granted explicitly. service_role keeps
-- its defaults (server-side only).
-- Limitation: PostgreSQL itself grants EXECUTE on every new function to PUBLIC (which
-- includes anon). That built-in default can only be removed globally (all schemas), not
-- per schema, so it is NOT changed here; every new function must still
-- `revoke execute ... from public` explicitly, as this file does.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

commit;
