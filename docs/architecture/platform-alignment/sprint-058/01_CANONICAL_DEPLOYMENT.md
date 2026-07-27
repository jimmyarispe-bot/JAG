# Canonical deployment topology

**Single source of truth for where JAG / AcademyOS (Tenant #1) is deployed.**

---

## 1. Identity

| Layer | Value |
|-------|--------|
| **Git repository** | `jimmyarispe-bot/JAG` — `https://github.com/jimmyarispe-bot/JAG.git` |
| **Vercel team** | `jimmyarispe-bots-projects` |
| **Vercel project (canonical)** | **`academy-os`** |
| **Project ID** | `prj_FgjLb7jPoYBprf6JnxuUufi6uzLW` |
| **Framework** | Next.js (root directory `.`) |
| **Build** | `npm run build` (includes registry validators) |
| **Cron** | `vercel.json` → `GET /api/platform/process-queues` @ `0 0 * * *` |

Local CLI link: `.vercel/project.json` → `academy-os` (do not re-link to legacy projects).

---

## 2. Environments

| Environment | Git | Vercel target | Public URL policy |
|-------------|-----|---------------|-------------------|
| **Production** | `release/v1.0.0-rc1` (RC window) | Production | `https://academy-os-lac.vercel.app` + any custom domains **only** on `academy-os` |
| **Staging** | `staging` | Staging (or Production alias reserved for staging hostname) | `https://staging.<your-domain>` or Vercel Staging URL — **not** the Production alias |
| **Preview** | Feature branches + PRs | Preview | `*.vercel.app` deployment URLs only; never Production aliases |

### Branch rules (required in Vercel → Project → Settings → Git / Environments)

1. **Production Branch** = `release/v1.0.0-rc1` until GA; then promote to `main` by explicit release decision.  
2. **Staging**: create Git branch `staging`; attach a **Staging** environment custom domain or branch alias. Deploy Staging only from `staging` (or by promoting a Preview SHA into Staging — pick one policy and stick to it).  
3. **Preview**: enable for all non-production branches; ignore build step optional for docs-only if desired later.  
4. **Ignored build step**: do not ignore builds on `release/*` or `staging`.

Recommended Staging policy for this repo:

```text
merge/PR → Preview
  → merge to staging → Staging deploy + UAT
  → promote Staging SHA to Production
     OR merge staging → release/v1.0.0-rc1 → Production auto-deploy
```

Prefer **promote known-good Staging deployment** for Production during RC to avoid “wrong branch tip” surprises.

---

## 3. What Tenant #1 uses

| Audience | URL |
|----------|-----|
| **The Academy Way (production)** | `https://academy-os-lac.vercel.app` (and future custom domain on **this project only**) |
| Internal UAT | Staging hostname on **`academy-os`** |
| Engineering review | Preview URLs from PRs |

Do **not** bookmark or share:

- `https://the-jag-platform-jimmy.vercel.app`
- `https://the-jag-platform-2026.vercel.app`
- `https://the-jag-platform.vercel.app`

---

## 4. Non-canonical projects (inventory)

| Vercel project | Role after Sprint 058 |
|----------------|------------------------|
| **academy-os** | **Canonical** — only project serving Tenant #1 |
| the-jag-platform-jimmy | **Frozen** — disconnect Git; password-protect or remove Production |
| the-jag-platform-2026 | **Frozen** — former local `.vercel` link; disconnect Git |
| the-jag-platform | **Frozen** — disconnect Git |
| micms-vision-presentation | Unrelated presentation — out of scope (not JAG Tenant #1) |

Freeze procedure: [03_LEGACY_PROJECT_FREEZE.md](./03_LEGACY_PROJECT_FREEZE.md).

---

## 5. Deploy / rollback (canonical)

### Deploy Production

1. CI green on candidate SHA (see [02_CI_CD_FLOW.md](./02_CI_CD_FLOW.md)).  
2. UAT on Staging.  
3. Promote Staging deployment to Production **or** merge into Production branch so `academy-os` builds Production.  
4. Smoke: `/api/health`, `/api/ready`, staff login, portal login.  

### Rollback Production

1. Vercel → `academy-os` → Deployments → prior Ready Production → **Promote to Production**.  
2. Re-smoke.  
3. Do not “fix” by deploying a legacy project.

### Database

App deploy ≠ migrations. Coordinate Supabase migrations per `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md` (updated pointer).

---

## 6. Env var parity

Production and Staging on `academy-os` must both have required secrets (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_*`, `CRON_SECRET`, vault keys, etc.). Preview may use a non-prod Supabase project.

Never copy Production service-role keys into public docs or Preview forks without policy.
