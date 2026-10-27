# Architecture

```
Browser (Vercel, static SPA)                     Supabase
┌──────────────────────────────┐   POST JSON   ┌───────────────────────────────────────┐
│ Public site  (5 languages)   │──────────────▶│ Edge Function create-reservation      │
│  /reservations form          │  apikey only  │  CORS · size/JSON checks · validation │
│                              │               │  rate limit · idempotency · no PII log│
│                              │               │        │ service role (server only)   │
│ /staff (lazy bundle, Spanish)│  Supabase Auth│        ▼                              │
│  login · list · transitions  │──────────────▶│ Postgres: RLS + SECURITY DEFINER RPCs │
│  phone bookings              │  user JWT     │  staff_users · reservations           │
└──────────────────────────────┘               └───────────────────────────────────────┘
```

## Trust boundaries

- **Guests** never talk to the database. They call `create-reservation` with the publishable
  key; the function validates with the shared domain module and inserts with the service
  role, always as `status = pending`, `source = website`. Client-supplied `status`, `source`,
  `id` or `created_by` are rejected as unknown fields. The database enforces the same rule
  (an insert trigger rejects website rows that do not start `pending`), and the service role
  holds only SELECT and INSERT on reservations and EXECUTE on the rate limiter.
- **Staff** sign in with Supabase Auth (no public sign-up). Reads go through RLS
  (`is_current_user_staff()`); every write goes through `staff_set_reservation_status`
  (allowed transitions only) or `staff_create_phone_reservation` (records `source = phone`
  and an active staff `created_by`). No API role, including the service role, can UPDATE,
  DELETE or TRUNCATE reservations or write `staff_users`; nothing is deleted through the API.
- **The UI is not the security boundary.** Hiding buttons is convenience; the database
  refuses non-staff, suspended staff, invalid transitions and direct writes (integration tests).

## Availability and the booking tracker

- The form asks `get_availability` (public, returns slot times and yes/no only) once a date
  and party size are set, and offers only available times. That answer is a guide; the
  binding decision is the atomic capacity check inside `create_website_reservation`, so a
  slot that fills up in the meantime is refused with 409 and the form refreshes the list.
- `/reservations/status` calls the `lookup-reservation` Edge Function with reference and
  phone. Unknown reference and wrong phone get the same 404; every attempt is rate-limited
  (10 per client and 300 overall per 10 minutes); only reference, date, time, party size and
  status are returned. The phone must match the one given at booking (after removing
  spaces and dashes), so a guest who booked with `+34` must include it.
- Business rules live in database tables (see `docs/DATABASE.md`); every value except the
  published capacity is a placeholder until the venue confirms it.

## Shared domain module

`supabase/functions/_shared/reservation.ts` is runtime-neutral TypeScript imported by the
browser, the Edge Function and the staff UI. It owns the field list, limits (party size 1–90
from the published capacity; name 2–100 to match the hosted constraint), the Europe/Madrid
"not in the past" rule, the five languages and the status-transition table. Opening hours,
slots and per-day capacity are deliberately not enforced: the venue publishes them as "by
arrangement", and staff confirm each request.

## Decisions

- **Staff area in English (default), Basque and Spanish**, with its own selector and its own
  stored preference (`iturrieta.staff.lang`), independent of the public site's five languages
  (`iturrieta.lang`). All staff strings live in `src/staff/staffCopy.ts`; TypeScript enforces
  identical keys, and a test fails if any string from another staff language is left on
  screen. The Basque and Spanish staff strings are unreviewed drafts (see below).
- **Translation review needed (staff area)**: Basque status labels ("Zain" for pending,
  "Berretsita", "Baztertuta", "Ezeztatuta"), Basque counts written as "3 erreserba" /
  "1 erreserba" (no singular form) and Basque confirmation prompts should be checked by a
  native speaker; the Spanish strings by a Spanish-speaking member of the venue team.
- **German content is an unofficial translation** (flagged in the footer). French and Basque
  interface strings are drafts pending review; venue facts come from the official site.
- **Rate limiting** is per salted client-IP hash (5 per 10 minutes) plus a global budget
  (200 per 10 minutes), because `X-Forwarded-For` can be partly spoofed.
- **Idempotency**: the form sends a `requestId` (UUID) that is reused on retry, so a lost
  response never creates a duplicate; a new id is generated after success.
- **Offline fallback**: without backend configuration the form prepares a WhatsApp/phone
  message instead of pretending to send.

## Repository map

| Path | Contents |
|---|---|
| `src/` | Public site (React 19, React Router), `src/staff/` staff area, `src/services/` HTTP client |
| `supabase/functions/` | `create-reservation` (handler + Deno entry), `_shared/` domain and HTTP helpers |
| `supabase/drafts/` | Unapplied migration, rollback and read-only hosted precheck |
| `supabase/snapshots/` | Schema-only snapshot of the hosted `public` schema |
| `tests/integration/` | Tests against the local Supabase stack only |
| `scripts/` | Local-only helpers (`env:local`, local staff account) |
| `docs/` | Setup, deployment, database and this document |
