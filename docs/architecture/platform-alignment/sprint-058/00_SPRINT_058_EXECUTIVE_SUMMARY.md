# Sprint 058 — Phase 0: Canonical Deployment Alignment

## Executive summary

| Field | Value |
|-------|--------|
| **Goal** | One source of truth for deployment — not new product functionality |
| **Date** | 2026-07-26 |
| **Depends on** | Sprint 057 Platform Alignment (Phase 0 of migration plan) |

### Decision

| Item | Canonical value |
|------|-----------------|
| Git repository | `https://github.com/jimmyarispe-bot/JAG.git` |
| Vercel project | **`academy-os`** (`prj_FgjLb7jPoYBprf6JnxuUufi6uzLW`) |
| Production URL | `https://academy-os-lac.vercel.app` (and custom domains attached to this project only) |
| Production git branch | `release/v1.0.0-rc1` (until GA cutover to `main` is explicitly approved) |
| Staging git branch | `staging` (create/protect; aliases to Staging environment) |
| Preview | All other branches and all PRs — **Preview** environment only |

### Why

Multiple Vercel projects (`academy-os`, `the-jag-platform-jimmy`, `the-jag-platform-2026`, `the-jag-platform`) were connected to related code and served different SHAs. Tenant #1 operators hit the wrong shell (e.g. Education ERP @ `e7f6a66` on `the-jag-platform-jimmy`).

### Done in-repo (this sprint)

- Local `.vercel` linked to **`academy-os`** (was `the-jag-platform-2026`).  
- Canonical deployment + CI/CD documentation published under this folder.  
- GitHub Actions CI triggers expanded to include `release/v1.0.0-rc1` and `staging`.  
- Phase 0 migration plan updated to point here.  
- Legacy freeze **checklist** published (Vercel Dashboard steps required for full “not serving users”).

### Freeze status (2026-07-26)

| Project | Git connected? |
|---------|----------------|
| `the-jag-platform-jimmy` | **No** — cannot auto-deploy |
| `the-jag-platform` | **No** — cannot auto-deploy |
| `the-jag-platform-2026` | **No** — cannot auto-deploy |
| `academy-os` (canonical) | Linked locally; Production Git remains the deploy source |

**Sprint 058 complete** for Git freeze. Optional follow-up: password-protect legacy Production URLs so old deployments are not casually browsable ([03_LEGACY_PROJECT_FREEZE.md](./03_LEGACY_PROJECT_FREEZE.md) §B).
