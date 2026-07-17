# 02 — Production Readiness

**Phase:** C · **Date:** 2026-07-17

---

## Production readiness score: **72 / 100**

| Factor | Score | Notes |
|-------:|------:|-------|
| AuthN/AuthZ architecture | 85 | Central middleware + catalog |
| Data isolation (code + migrations in repo) | 75 | Needs live apply |
| Secrets & env contract | 82 | Schema + instrumentation; ready probe enhanced |
| Observability (health/ready) | 78 | Liveness + readiness; no deep DB probe by design |
| CI/CD gates | 85 | lint, tsc, build, unit, integration, smoke, mig check |
| Deploy/rollback documentation | 80 | Phase F runbooks |
| Backup/DR documentation | 72 | Runbooks exist; drill evidence ops |
| Dependency risk | 70 | Moderate PostCSS via Next; no Critical |
| Config consistency | 78 | PRODUCTION_ENV aligned; checklist incomplete |
| Intelligence product honesty | 70 | Contract + provenance; durability open |

**Weighted ≈ 72**

---

## Verification performed (this phase)

| Gate | Result |
|------|--------|
| `npm run typecheck` | Pass |
| `npm run test:unit` | **694 passed** |
| `npm run build` | Pass |
| `node scripts/verify-security-migrations-present.mjs` | Pass |
| `npm audit --omit=dev` | 2 moderate (PostCSS via Next) — no Critical |

---

## Production configuration consistency

| Setting | Required posture |
|---------|------------------|
| `ALLOW_SQUARE_PLANNED` | Unset in production |
| `ALLOW_EXEC_DEMO_MODE` | Unset unless approved |
| `EXEC_OPERATING_MODE` | Prefer `tenant` / unset |
| `ENFORCE_MFA` | `true` or documented exception |
| `VAULT_ENCRYPTION_KEY` | ≥32 chars |
| `CRON_SECRET` | Set; used by Vercel cron |
| Migrations | Head through **172** |

Canonical lists: `docs/launch/PRODUCTION_ENV.md` · `src/lib/platform/env/schema.ts`

---

## What “ready” means

| Ready for… | Status |
|------------|--------|
| Deploy AcademyOS school ops with IAM | **Yes, if ops checklist closed** |
| Claim durable enterprise OIOS wisdom | **No** — C-A1 |
| Security GO without live RLS evidence | **No** — CONDITIONAL only |
