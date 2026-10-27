# Deployment

Every step below that touches the hosted Supabase project or Vercel needs explicit
authorization from the project owner. Local verification proves the code against the
captured snapshot only.

## Status of `gytuoplvnlcjwsypdrxg` (2026-10-27)

| Step | State |
|---|---|
| Logical backup of `public` (schema + data) before migrating | Taken outside the repo; schema identical to the snapshot (no platform backup existed yet) |
| Precheck | 22/22 OK |
| Migrations 0001 + 0002 | Applied; post-check matches "Applying to the hosted project" step 4. Not yet recorded in `supabase/migrations/` or the migration history |
| Auth | Public sign-up disabled, email provider enabled; Site URL still `http://localhost:3000` |
| Staff | One active staff row |
| `RATE_LIMIT_SALT` | Set |
| `ALLOWED_ORIGINS` | **Not set** — the function answers 500 (fail-closed) until it is |
| `create-reservation` | Deployed, `verify_jwt = false` |
| `lookup-reservation` | Not deployed |
| Booking rules | Placeholders, `verified_by_venue = false` |
| Live smoke test | Not run (blocked on `ALLOWED_ORIGINS`) |

## Configuration and secrets

| Name | Where | Secret? | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Vercel env (Production, Preview) | No | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel env | No | Publishable/anon key only. The app refuses `sb_secret_…`/service-role keys |
| `ALLOWED_ORIGINS` | Supabase function secret | No | Exact origins, comma-separated, e.g. the production domain and the Vercel preview domain you test from |
| `RATE_LIMIT_SALT` | Supabase function secret | **Yes** | Long random string, unique per environment |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Injected by Supabase into functions | **Yes** (service role) | Never set by hand, never in Vercel, never in `VITE_` variables |

## Order of operations

1. **Database** — follow "Applying to the hosted project" in `docs/DATABASE.md`.
2. **Auth settings** (Dashboard → Authentication): disable "Allow new users to sign up";
   keep the Email provider enabled (staff sign in with password). Set the Site URL to the
   production domain.
3. **Staff accounts** — create users in Dashboard → Authentication → Users, then insert their
   ids into `public.staff_users` from the SQL editor (as `postgres`; no API key, not even the
   service role, can write that table). Suspend with `update public.staff_users set active =
   false where user_id = '…'`. Accounts that entered or changed bookings cannot be deleted
   (their audit links reference them); suspend them instead.
4. **Edge Function**
   ```powershell
   npx supabase secrets set ALLOWED_ORIGINS=https://<domain> RATE_LIMIT_SALT=<random> --project-ref <ref>
   npx supabase functions deploy create-reservation --project-ref <ref>
   npx supabase functions deploy lookup-reservation --project-ref <ref>
   ```
   `supabase/config.toml` sets `verify_jwt = false` for both public functions (guests have no
   session); confirm in the dashboard that JWT verification is off for these two only. Both
   use the same `ALLOWED_ORIGINS` and `RATE_LIMIT_SALT` secrets. The current
   `create-reservation` code requires migration 0002 (it books through
   `create_website_reservation`).
5. **Vercel** — import the repository; framework Vite; build `npm run build`; output `dist`
   (also in `vercel.json`). Add the two `VITE_` variables, deploy a Preview first.

## Smoke test (Preview first, then Production)

Use a clearly fake guest (e.g. "Smoke Test", phone +34600000000) and cancel it afterwards.

- [ ] `/`, `/menus`, `/reservations`, `/staff` and an unknown path load directly and on reload (SPA rewrite).
- [ ] Language selector switches all five languages; reload keeps the choice.
- [ ] Browser devtools: the `OPTIONS` preflight to `create-reservation` returns 204 with `Access-Control-Allow-Origin` equal to the site origin (this cannot be checked locally, where the gateway answers preflights itself).
- [ ] Submitting the form shows "received, pending" with an `IT-XXXXXXXX` reference; the request carries only the `apikey` header.
- [ ] From another origin (e.g. `curl -H "Origin: https://example.com"`), the function answers 403.
- [ ] Six quick submissions from one browser: the sixth shows the rate-limit message.
- [ ] Choosing a date and party size lists only available times; a closed date (add one to `booking_closures`) shows the "no times left" state.
- [ ] `/reservations/status`: the reference and phone from a test request show its date, time, guests and status; a wrong phone and an invented reference both show the same "not found" message; the eleventh quick attempt shows the rate-limit message.
- [ ] `/staff` opens in English; the language selector switches to Euskara and Castellano and the choice survives a reload; changing the public site's language does not change it.
- [ ] `/staff`: wrong password refused; a non-staff account sees "No access"; a staff account sees the request, confirms it, then cancels it.
- [ ] Phone booking from `/staff` appears as "Phone" and "Confirmed" (English).
- [ ] Function logs contain only event names and codes, no names, phones or notes.
- [ ] View source of the built JS: no `sb_secret_`, no service-role JWT, no localhost URL.

## Recovery

- **Frontend regression** — Vercel → Deployments → promote the previous deployment (instant rollback).
- **Function regression** — redeploy the previous commit's function (`git checkout <sha> -- supabase/functions` in a scratch worktree, then `functions deploy`). To stop public submissions immediately, `npx supabase secrets unset ALLOWED_ORIGINS --project-ref <ref>`: the function then answers 500 and the site falls back to the WhatsApp/phone path.
- **Bad data from the website** — staff reject or cancel the requests; rows are never deleted. If spam gets through, lower the limits in `supabase/functions/create-reservation/index.ts` and redeploy.
- **Migration problem** — in this order (details in `docs/DATABASE.md`, "Recovery"):
  1. *Forward fix* (preferred): a new reviewed migration correcting the faulty function or trigger.
  2. *Safe rollback* (`0001_reservation_backend.rollback.sql`): switches the new behaviour off without losing data or reopening access; the public form then fails closed and staff are read-only until the migration is re-applied.
  3. *Destructive teardown* (`0001_reservation_backend.teardown.sql`): separate review only; permanently deletes references and audit data and needs an explicit confirmation setting.
  4. *Backup restore*: the only lossless return to the pre-migration state, at the cost of every change made since the backup.

  None of these restores the original permissive grants, the staff DELETE/UPDATE policies or anon access to `is_current_user_staff()`.
- **Leaked secret** — rotate it immediately: service-role/secret keys in Dashboard → Settings → API; `RATE_LIMIT_SALT` with `supabase secrets set`; then redeploy the function.
