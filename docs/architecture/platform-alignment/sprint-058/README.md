# Sprint 058 — Phase 0: Canonical Deployment Alignment

| Field | Value |
|-------|--------|
| **Sprint** | 058 — Canonical Deployment Alignment (platform ops track) |
| **Parent** | [Sprint 057 migration Phase 0](../02_MIGRATION_PLAN.md) |
| **Mode** | Deployment topology + documentation (no product features) |
| **Canonical Vercel project** | `academy-os` (`prj_FgjLb7jPoYBprf6JnxuUufi6uzLW`) |
| **Canonical Git repo** | `https://github.com/jimmyarispe-bot/JAG.git` |

---

## Numbering note

Intelligence roadmap **Sprint 058 — Institutional Memory** is a different track. Cite **Sprint 058 Deployment** vs **Sprint 058 Institutional Memory**.

---

## Package

| Doc | Role |
|-----|------|
| [00_SPRINT_058_EXECUTIVE_SUMMARY.md](./00_SPRINT_058_EXECUTIVE_SUMMARY.md) | Goals, success criteria, status |
| [01_CANONICAL_DEPLOYMENT.md](./01_CANONICAL_DEPLOYMENT.md) | One repo · one project · Prod / Staging / Preview |
| [02_CI_CD_FLOW.md](./02_CI_CD_FLOW.md) | GitHub Actions + Vercel promotion flow |
| [03_LEGACY_PROJECT_FREEZE.md](./03_LEGACY_PROJECT_FREEZE.md) | Non-canonical projects must not serve users |

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| One Git repository | ✅ `jimmyarispe-bot/JAG` |
| One canonical Vercel project | ✅ `academy-os` |
| One Production deployment | ✅ Documented; alias `academy-os-lac.vercel.app` |
| One Staging deployment | ✅ Documented (`staging` branch / alias policy) |
| Preview only for feature branches | ✅ Documented |
| No legacy Git auto-deploy | ✅ Verified 2026-07-26 — all three return “No Git repository connected” |
| Legacy URLs still publicly reachable | ⚠️ Optional: password-protect in Dashboard ([03](./03_LEGACY_PROJECT_FREEZE.md)) |
| Deployment documentation updated | ✅ This package + runbook pointer |
| CI/CD flow documented | ✅ `02_CI_CD_FLOW.md` + CI branch triggers |
