# CI/CD flow (canonical)

**Repo:** `jimmyarispe-bot/JAG`  
**Deploy target:** Vercel project **`academy-os` only**

---

## 1. Pipeline overview

```text
  Developer branch ──push──► Preview deploy (academy-os)
         │
         ├── PR ──► GitHub Actions CI (lint, typecheck, tests, build, e2e)
         │            + Vercel Preview URL for QA
         │
         ▼
  staging ──merge/promote──► Staging deploy (academy-os Staging)
         │                      UAT / Tenant #1 dry-run
         ▼
  release/v1.0.0-rc1 ──► Production deploy (academy-os Production)
         or Promote Staging SHA → Production
```

GitHub Actions **does not** deploy to Vercel in the current workflow; Vercel’s Git integration builds on push. CI is the quality gate before merge/promote.

---

## 2. GitHub Actions (`/.github/workflows/ci.yml`)

| Trigger | Branches |
|---------|----------|
| `push` | `main`, `release/v1.0.0-rc1`, `staging` |
| `pull_request` | targeting `main`, `release/v1.0.0-rc1`, `staging` |

### Jobs (summary)

1. Install (`npm ci`)  
2. Lint · typecheck  
3. Perf / security / acceptance harnesses (RC suites)  
4. `npm run build`  
5. Unit · integration · Playwright smoke/e2e  

Placeholders are used for secrets in CI; live deploys use Vercel env.

**Merge rule:** Do not merge to `staging` or `release/v1.0.0-rc1` while CI is red on that PR.

---

## 3. Vercel Git integration (`academy-os`)

| Event | Result |
|-------|--------|
| Push to Production branch (`release/v1.0.0-rc1`) | Production deployment |
| Push to `staging` | Staging deployment |
| Push to any other branch / PR | Preview deployment |

### Required Dashboard settings

**Project → Settings → Git**

- Connected repository: `jimmyarispe-bot/JAG`  
- Production Branch: `release/v1.0.0-rc1`  
- Deploy Hooks: optional; prefer Git-based  

**Project → Settings → Environments**

- Production domain(s) only on Production  
- Staging domain on Staging  
- Preview: deployment protection optional for private previews  

---

## 4. Promotion checklist

### A. Feature → Staging

1. PR into `staging` (or merge after Preview approval).  
2. CI green.  
3. Confirm Staging URL on `academy-os`.  
4. UAT smoke (login, dashboard home, one critical module).  

### B. Staging → Production

1. Record Staging deployment ID / Git SHA.  
2. Either:  
   - **Promote** that deployment to Production in Vercel, or  
   - Merge `staging` → `release/v1.0.0-rc1` and wait for Production Ready.  
3. Post-deploy smoke on `https://academy-os-lac.vercel.app`.  
4. Note deployment ID for rollback.

---

## 5. What not to do

| Anti-pattern | Why |
|--------------|-----|
| `vercel --prod` against a non-canonical project | Creates a second Production |
| Re-link local `.vercel` to `the-jag-platform-*` | Wrong default for CLI deploys |
| Share Preview URL as “the app” for Tenant #1 | Not Production; SHA drifts |
| Deploy from `the-jag-platform-jimmy` after freeze | Violates Sprint 058 |

---

## 6. Related runbooks

- Canonical topology: [01_CANONICAL_DEPLOYMENT.md](./01_CANONICAL_DEPLOYMENT.md)  
- Ops procedures: `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md`  
- Env checklist: `docs/launch/PRODUCTION_ENV.md`  
