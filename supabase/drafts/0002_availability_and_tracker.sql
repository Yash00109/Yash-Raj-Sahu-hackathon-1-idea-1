-- =============================================================================
-- DRAFT migration 0002 — NOT applied to the hosted project. Requires explicit authorization.
-- Depends on 0001_reservation_backend.sql. Atomic and idempotent, like 0001.
--
-- Adds server-enforced availability (overbooking protection) and the data side of the
-- guest booking tracker.
--
-- BUSINESS RULES — PLACEHOLDERS UNTIL THE VENUE CONFIRMS THEM (verified_by_venue = false):
--   * capacity 90 covers: from the official site ("capacidad para 90 comensales");
--   * booking duration 120 min, minimum lead time 60 min, booking window 180 days;
--   * bookable slots 13:00–14:30 and 20:30–21:30, every day.
--   None of the durations, slots or days is an official fact. Change them in
--   public.booking_settings / public.booking_slots / public.booking_closures.
--
-- CAPACITY POLICY: `pending` and `confirmed` reservations hold seats; `rejected` and
-- `cancelled` release them. A reservation occupies its seats from its start time for
-- `duration_minutes`; a request fits if the seats held by every reservation overlapping
-- its window, plus its party, stay within `capacity`. Seating (indoor/terrace) is a
-- preference only: there is ONE shared capacity, no per-area allocation.
-- =============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Configuration ------------------------------------------------------------------
create table if not exists public.booking_settings (
  id boolean primary key default true check (id),
  capacity integer not null check (capacity > 0),
  max_party_size integer not null check (max_party_size > 0),
  duration_minutes integer not null check (duration_minutes between 15 and 600),
  min_lead_minutes integer not null check (min_lead_minutes >= 0),
  max_advance_days integer not null check (max_advance_days between 1 and 730),
  verified_by_venue boolean not null default false,
  updated_at timestamptz not null default now(),
  check (max_party_size <= capacity)
);
insert into public.booking_settings (capacity, max_party_size, duration_minutes, min_lead_minutes, max_advance_days, verified_by_venue)
values (90, 90, 120, 60, 180, false)
on conflict (id) do nothing;

create table if not exists public.booking_slots (
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1 = Monday … 7 = Sunday
  slot_time time not null check (extract(second from slot_time) = 0),
  primary key (weekday, slot_time)
);
insert into public.booking_slots (weekday, slot_time)
select d, t::time
from generate_series(1, 7) d,
     unnest(array['13:00', '13:30', '14:00', '14:30', '20:30', '21:00', '21:30']) t
on conflict do nothing;

create table if not exists public.booking_closures (
  closed_on date primary key,
  note text check (note is null or char_length(note) <= 200)
);

alter table public.booking_settings enable row level security;
alter table public.booking_slots enable row level security;
alter table public.booking_closures enable row level security;

-- Unpredictable references for new rows: 12 hex characters (48 random bits) instead of 8.
alter table public.reservations
  alter column reference set default ('IT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));

create index if not exists reservations_active_date_idx on public.reservations (reservation_date)
  where status in ('pending', 'confirmed');

-- Shared helpers -------------------------------------------------------------------
-- Seats held by active reservations overlapping [p_start, p_start + duration).
create or replace function public.seats_held(p_start timestamp, p_duration integer)
returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(r.party_size), 0)::integer
  from public.reservations r
  where r.status in ('pending', 'confirmed')
    and r.reservation_date between (p_start::date - 1) and (p_start::date + 1)
    and (r.reservation_date + r.reservation_time) < p_start + make_interval(mins => p_duration)
    and (r.reservation_date + r.reservation_time) + make_interval(mins => p_duration) > p_start;
$$;

-- Public availability: slot times and a yes/no flag only — no counts, no reservation data.
create or replace function public.get_availability(p_date date, p_party_size integer)
returns table (slot_time text, available boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.booking_settings;
  local_now timestamp := now() at time zone 'Europe/Madrid';
begin
  select * into s from public.booking_settings where id;
  if p_date is null then
    raise exception 'date_invalid' using errcode = '22023';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > s.max_party_size then
    raise exception 'party_size_invalid' using errcode = '22023';
  end if;
  if exists (select 1 from public.booking_closures c where c.closed_on = p_date) then
    return;
  end if;

  return query
    select to_char(b.slot_time, 'HH24:MI'),
           (p_date + b.slot_time) >= local_now + make_interval(mins => s.min_lead_minutes)
             and p_date <= local_now::date + s.max_advance_days
             and public.seats_held(p_date + b.slot_time, s.duration_minutes) + p_party_size <= s.capacity
    from public.booking_slots b
    where b.weekday = extract(isodow from p_date)
    order by b.slot_time;
end;
$$;

-- The ONLY write path for website requests: idempotent, capacity-checked, atomic.
create or replace function public.create_website_reservation(
  p_request_id uuid,
  p_guest_name text,
  p_phone text,
  p_reservation_date date,
  p_reservation_time time,
  p_party_size integer,
  p_seating_preference text,
  p_preferred_language text,
  p_notes text default null
)
returns table (reference text, status text, replayed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  s public.booking_settings;
  local_now timestamp := now() at time zone 'Europe/Madrid';
  slot_start timestamp := p_reservation_date + p_reservation_time;
  created public.reservations;
begin
  if p_request_id is null then
    raise exception 'request_id_required' using errcode = '22004';
  end if;

  -- Serialize every capacity decision; held until commit. Bookings are low-volume, so a
  -- single lock is simpler and safer than per-slot locks (windows overlap across slots).
  perform pg_advisory_xact_lock(hashtext('iturrieta.reservation_capacity'));

  return query select r.reference, r.status, true from public.reservations r where r.request_id = p_request_id;
  if found then
    return;
  end if;

  select * into s from public.booking_settings where id;
  if not exists (
       select 1 from public.booking_slots b
       where b.weekday = extract(isodow from p_reservation_date) and b.slot_time = p_reservation_time)
     or exists (select 1 from public.booking_closures c where c.closed_on = p_reservation_date)
     or slot_start < local_now + make_interval(mins => s.min_lead_minutes)
     or p_reservation_date > local_now::date + s.max_advance_days then
    raise exception 'slot_not_offered' using errcode = 'P0001';
  end if;
  if p_party_size > s.max_party_size
     or public.seats_held(slot_start, s.duration_minutes) + p_party_size > s.capacity then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  insert into public.reservations (
    guest_name, phone, reservation_date, reservation_time, party_size, seating_preference,
    preferred_language, notes, request_id, status, source
  ) values (
    p_guest_name, p_phone, p_reservation_date, p_reservation_time, p_party_size, p_seating_preference,
    p_preferred_language, p_notes, p_request_id, 'pending', 'website'
  )
  returning * into created;
  return query select created.reference, created.status, false;
end;
$$;

-- Staff phone bookings respect the same capacity (any time of day: dinners and groups
-- are arranged by phone, so the public slot list does not apply).
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
  s public.booking_settings;
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

  perform pg_advisory_xact_lock(hashtext('iturrieta.reservation_capacity'));
  select * into s from public.booking_settings where id;
  if p_party_size > s.max_party_size
     or public.seats_held(p_reservation_date + p_reservation_time, s.duration_minutes) + p_party_size > s.capacity then
    raise exception 'slot_unavailable' using errcode = 'P0001';
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

-- Guest booking tracker: exact reference AND the booking phone must match. Returns only
-- reference, date, time, party size and status. Called by the lookup Edge Function only.
create or replace function public.lookup_reservation(p_reference text, p_phone text)
returns table (reference text, reservation_date date, reservation_time text, party_size integer, status text)
language sql stable security definer set search_path = '' as $$
  select r.reference, r.reservation_date, to_char(r.reservation_time, 'HH24:MI'), r.party_size, r.status
  from public.reservations r
  where r.reference = upper(btrim(p_reference))
    and regexp_replace(r.phone, '[^0-9+]', '', 'g') = regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')
    and length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) >= 7
  limit 1;
$$;

-- Privileges ------------------------------------------------------------------------
revoke all on table public.booking_settings, public.booking_slots, public.booking_closures from public, anon, authenticated, service_role;
-- Website requests can no longer be inserted directly, only through create_website_reservation.
revoke insert on table public.reservations from service_role;

revoke all on function public.seats_held(timestamp, integer) from public, anon, authenticated, service_role;
revoke all on function public.get_availability(date, integer) from public, anon, authenticated, service_role;
revoke all on function public.create_website_reservation(uuid, text, text, date, time, integer, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.lookup_reservation(text, text) from public, anon, authenticated, service_role;
revoke all on function public.staff_create_phone_reservation(text, text, date, time, integer, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.get_availability(date, integer) to anon, authenticated, service_role;
grant execute on function public.create_website_reservation(uuid, text, text, date, time, integer, text, text, text) to service_role;
grant execute on function public.lookup_reservation(text, text) to service_role;
grant execute on function public.staff_create_phone_reservation(text, text, date, time, integer, text, text, text, text) to authenticated;

commit;
