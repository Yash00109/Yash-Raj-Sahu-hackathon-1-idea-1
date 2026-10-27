# Local setup

Requirements: Node 24+, npm, Docker Desktop (only for the backend).

## Frontend only

```powershell
npm ci
npm run dev          # http://localhost:5180
npm test             # unit and component tests (never touch a backend)
npm run lint
npm run build
```

Without Supabase variables the reservation form prepares a WhatsApp/phone request and
`/staff` reports that it is not configured. That is the expected offline behaviour.

## Full stack on the local Supabase (never the hosted project)

```powershell
# 1. Start the local stack (no login or link needed).
npx supabase start -x studio,imgproxy,logflare,vector,realtime,storage-api,supavisor,mailpit,postgres-meta

# 2. Build the local schema: hosted snapshot + draft migration (see docs/DATABASE.md).
$db = 'supabase_db_Iturrieta'
docker cp supabase/snapshots/remote_public_schema.sql "${db}:/tmp/snapshot.sql"
docker cp supabase/drafts/0001_reservation_backend.sql "${db}:/tmp/migration.sql"
docker exec $db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'drop schema public cascade'
docker exec $db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/snapshot.sql
docker exec $db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/migration.sql

# 3. Function secrets: copy the example and fill RATE_LIMIT_SALT with a random value.
Copy-Item supabase/functions/.env.example supabase/functions/.env
npx supabase functions serve --env-file supabase/functions/.env   # keep running

# 4. Point the dev server at the local stack (writes .env.development.local, git-ignored).
npm run env:local
npm run dev

# 5. Integration tests (local Docker stack only). WARNING: the migration suite drops and
#    rebuilds the LOCAL public schema from the snapshot, so local reservations and staff
#    rows are wiped; it always finishes with the migration applied.
npm run test:integration

# 6. Optional: a throwaway local staff account for /staff.
#    The password is written to supabase/.temp/local-staff.json (git-ignored), never printed.
node scripts/local-staff.mjs
node scripts/local-staff.mjs --delete
```

## Layout check in a real browser

`src/layout.test.ts` guards the CSS rules behind the old hero clipping bug, but jsdom cannot
render layout. After changing hero or page layout, check in a real browser at 1440×900,
1366×768, 1280×720, 1280×600, 1100×600, 900×600, 768×700, 390×844, 320×640 and phone
landscape (844×390), loading fresh and also shrinking an open window:

- the hero heading and the "Book a table" button are on the first screen (or, on very
  short windows, reachable by normal scrolling), and nothing overlaps the header;
- the photographs stay inside the hero; nothing is cut off at the bottom of the hero;
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`
  (no horizontal scrollbar) on every route, including `/staff` and the 404 page.

`supabase/config.toml` disables public sign-up locally; staff accounts are created by an
administrator (locally with the script above, which writes `staff_users` as the local
database owner because no API role may). Run it again after the integration tests, since
they rebuild the local schema.
