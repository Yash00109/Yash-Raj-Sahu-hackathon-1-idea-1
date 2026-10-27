# Sidrería Iturrieta

Website for Iturrieta, a cider house in Aramaio (Álava): a five-language public site
(Euskara, Español, Français, English, Deutsch) with online reservation requests and a
staff dashboard for confirming them.

- Public site: React 19 + TypeScript + Vite, deployed as a static SPA (Vercel).
- Reservations: a Supabase Edge Function stores requests as *pending*; staff confirm,
  reject or cancel them at `/staff`. Nothing is confirmed automatically.

```powershell
npm ci
npm run dev        # http://localhost:5180
npm test           # unit/component tests
npm run lint
npm run build
```

| Document | Contents |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Local development, including the local Supabase stack and integration tests |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Components, trust boundaries and design decisions |
| [docs/DATABASE.md](docs/DATABASE.md) | Hosted schema findings, draft migration, verification |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Secrets, deployment order, smoke test, recovery |

Venue facts, menus and photos come from the official site (iturrieta.eus) and are credited
on each page.
