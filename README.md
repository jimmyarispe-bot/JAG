# AcademyOS (school-platform)

Education operating system built with **Next.js 16** and **Supabase**.

> **Operations & documentation (Release Phase F):** start at [`docs/operations/phase-f/README.md`](docs/operations/phase-f/README.md).  
> **Architecture (current truth):** [`docs/architecture/README.md`](docs/architecture/README.md) · [`docs/architecture/phase-a/`](docs/architecture/phase-a/) · [`docs/architecture/PLATFORM_CONSTITUTION.md`](docs/architecture/PLATFORM_CONSTITUTION.md)  
> **Security (Phase B):** [`docs/security/phase-b/SECURITY_REPORT.md`](docs/security/phase-b/SECURITY_REPORT.md)  
> **UX (Phase D):** [`docs/ux/phase-d/UX_REPORT.md`](docs/ux/phase-d/UX_REPORT.md)

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- React 19
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Deploy: **Vercel** + Supabase (see Phase F deployment runbook)

## Schema / migrations

Source of truth: `supabase/migrations/*.sql` (monotonic `NNN_*.sql`, head through **`172_b1_security_remediation.sql`**, including security hardening **171+172**).

Do **not** treat the historical Phase 1 table below as complete. Apply all migrations in order via Supabase CLI/dashboard. Database ops: [`docs/operations/phase-f/04_DATABASE_DOCUMENTATION.md`](docs/operations/phase-f/04_DATABASE_DOCUMENTATION.md).

Early Phase 1 foundation (historical reference only — superseded by later migrations):

| Migration | Purpose |
|-----------|---------|
| `001`–`042` | Core schools/users/students/classes + initial RLS/RBAC lock |

## Quick start

```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and other vars
# See docs/launch/PRODUCTION_ENV.md and src/lib/platform/env/schema.ts

npm install
npm run dev
```

Open http://localhost:3000 → `/login`.

### Common scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Registry validators + Next build |
| `npm run typecheck` | TypeScript |
| `npm run test` | Vitest |
| `npm run test:integration` | Integration tests |
| `npm run test:smoke` | Playwright smoke |

## Product surfaces

| Surface | Path |
|---------|------|
| Staff ERP | `/dashboard` |
| Family portal | `/portal` |
| Admissions | `/apply` |
| Executive (JAG) | `/exec` |
| Cloud / Operations | `/cloud`, `/operations` |

## Agent / Next.js note

See [`AGENTS.md`](AGENTS.md) — this Next.js version may differ from older training data; consult `node_modules/next/dist/docs/` before changing framework APIs.

## License

Private — see organization policy.
