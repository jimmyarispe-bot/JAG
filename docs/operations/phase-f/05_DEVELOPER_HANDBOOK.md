# Developer Handbook — AcademyOS

| Field | Value |
|-------|-------|
| **Purpose** | Onboard engineers to build, test, and release safely |
| **Scope** | Repo structure, standards, local dev, CI/CD |
| **Audience** | Developers, contractors |
| **Prerequisites** | Node 20+, npm, Supabase project or CLI |
| **Version** | 1.0.0 |

---

## Repository structure

```
src/app/           # Routes (App Router), api/, layouts
src/components/    # UI (dashboard, portal, WDS, XES, domain)
src/lib/           # Domain + platform logic, actions.ts
src/lib/platform/  # Cross-cutting engines + identity
src/types/         # database.ts mirror
supabase/migrations/
tests/             # unit, integration, smoke
docs/              # architecture, security, ux, operations
scripts/           # validate-*.mts registry validators
```

## Architecture principles

1. Permission-based authorization — not hardcoded roles for authz.  
2. Domain logic in `src/lib`, not fat `page.tsx`.  
3. Platform engines under `src/lib/platform/`.  
4. RLS + app permissions both required.  
5. Read `AGENTS.md` — Next.js 16 APIs may differ from training data; check `node_modules/next/dist/docs/`.

Canonical: `docs/architecture/ENGINEERING_STANDARDS.md`, `PLATFORM_CONTRACT.md`, `PLATFORM_CONSTITUTION.md`.

## Environment setup

```bash
cp .env.example .env.local   # or use PRODUCTION_ENV template
npm install
npx supabase start           # optional local
# apply migrations to linked project: supabase db push
npm run dev
```

Open `http://localhost:3000` → `/login`.

Required vars: see `src/lib/platform/env/schema.ts`.

## Coding standards

- TypeScript strict; match existing patterns.  
- Server Actions in `actions.ts`; use permission guards.  
- Prefer XES form primitives for new forms (UX Phase D).  
- No secrets in git.  
- Run validators before relying on CI.

## Dependency injection

Stabilization docs describe DI registration patterns (`docs/architecture/STABILIZATION_A1_DI_REGISTRATION.md`). Follow existing module registries; do not invent parallel containers.

## Testing standards

| Command | Purpose |
|---------|---------|
| `npm run test` | Vitest unit |
| `npm run test:integration` | Integration |
| `npm run test:smoke` | Playwright |
| `npm run typecheck` | `tsc` |
| `npm run lint` | ESLint |
| `npm run build` | Validators + Next build |

## Contribution / release process

1. Branch from `main`.  
2. PR with focused scope.  
3. CI must pass.  
4. Update Phase F API/DB docs if surface changes.  
5. Release via `14_RELEASE_OPERATIONS_MANUAL.md`.

## CI/CD

- CI: `.github/workflows/ci.yml` (no deploy).  
- CD: Vercel git integration.  
- DB: manual/approved `supabase db push`.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Build validator fail | Run failing `npm run validate:*` locally |
| Auth local issues | Check Supabase URL/keys; redirect URLs |
| Types wrong | Sync `database.ts` after migrations |

## Related documents

- Root `README.md`  
- `architecture/README.md`  
- `docs/architecture/ENGINEERING_STANDARDS.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial handbook |
