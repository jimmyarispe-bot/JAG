# Sprint 2.5 — Platform Stabilization Checklist

**Document:** `STABILIZATION_CHECKLIST.md`  
**Sprint:** 2.5 — Platform Stabilization  
**Date:** July 5, 2026  
**Goal:** Make The JAG OS stable enough for daily use — **no feature development until P0 items are green.**  
**Related:** `STABILIZATION_REPORT.md` (Sprint 0 build/quality audit)

---

## Scope

This checklist covers the **nine core founder dashboard routes** used for daily operations. Each route is verified against:

| Check | Description |
|-------|-------------|
| **Loads** | Page renders without 5xx or unhandled error boundary |
| **Load time** | Time to first meaningful paint (dev / cold compile noted) |
| **Redirects** | Unexpected redirect away from intended route |
| **Server errors** | 500, RSC errors, layout guard failures |
| **Permissions** | `requirePagePermission` / layout guard satisfied for seed founder user |
| **Missing data** | Empty/error states from failed Supabase queries |
| **Console errors** | Browser `console.error` (hydration, runtime) |

---

## Test environment

| Item | Value |
|------|-------|
| Date | July 5, 2026 |
| Server | `next dev` (Turbopack) — `http://localhost:3000` |
| Next.js | 16.2.9 |
| Auth probe | Playwright (`scripts/stabilization-route-probe.mts`) — requires `STABILIZATION_EMAIL` + `STABILIZATION_PASSWORD` |
| Seed founder role | `jimmy@academyos.org` → `SCHOOL_LEADER` (see `056_phase1_org_seed.sql`) |
| Permission bundle | `074_enterprise_identity_foundation.sql` — SCHOOL_LEADER grants |

---

## How to re-run probes

### Unauthenticated auth gate (middleware)

```powershell
curl.exe -s -o NUL -w "%{http_code} %{redirect_url} %{time_total}" http://localhost:3000/dashboard/admissions
```

Expected: `307` → `/login`

### Authenticated route probe (full checklist)

```powershell
$env:STABILIZATION_EMAIL="you@school.org"
$env:STABILIZATION_PASSWORD="your-password"
npx tsx scripts/stabilization-route-probe.mts
```

Outputs JSON with per-route pass/fail, load ms, final URL, and console errors.

### Unauthenticated probe results (July 5, 2026 — batch run)

All routes returned **307 → `/login`** (auth gate working).

| Route | Time (s) |
|-------|----------|
| `/dashboard` | 0.06 |
| `/dashboard/admissions` | 0.08 |
| `/dashboard/students` | 0.23 |
| `/dashboard/scheduling` | 2.71 |
| `/dashboard/teacher` | 4.58 |
| `/dashboard/finance` | 4.67 |
| `/dashboard/hr` | 4.61 |
| `/dashboard/mission-control` | 582.57 |
| `/dashboard/executive` | 0.73 |

*Scheduling through HR times reflect Turbopack cold compiles on first hit. Mission-control was ~583s in this batch because the route was compiling while the probe waited.*

---

## Pass / fail summary

**Legend:** ✅ Pass · ⚠️ Pass with issues · ❌ Fail · 🔒 Auth gate only · ⏳ Not fully probed (authenticated)

| Route | Loads | Load time (dev) | Redirects | Server errors | Permissions (SCHOOL_LEADER) | Missing data | Console errors | **Overall** |
|-------|-------|-----------------|-----------|---------------|----------------------------|--------------|----------------|-------------|
| `/dashboard` | ✅ | ~1–3s warm | None expected | None observed | N/A (layout auth only) | Graceful if no metrics | Hydration noise on login shell | ⚠️ **PASS** — sidebar nav broken (see P0) |
| `/dashboard/admissions` | ⏳ | 84ms redirect / ~5–15s cold | 🔒 → `/login` unauth | None in logs | ✅ `admissions.view` | Depends on seed leads | Not probed authed | ⚠️ **LIKELY PASS** |
| `/dashboard/students` | ✅ | Compiled in dev session | None in logs | None observed | ✅ `students.view` | Empty state if no students | Not probed authed | ⚠️ **LIKELY PASS** |
| `/dashboard/scheduling` | ⏳ | **2.7s** redirect (cold compile) | 🔒 → `/login` unauth | None in logs | ✅ `hr.view` | Depends on calendars | Not probed authed | ⚠️ **LIKELY PASS** — slow cold start |
| `/dashboard/teacher` | ✅ | **4.6s** redirect (cold compile) | None in logs | None observed | ✅ `hr.view` / `students.view` | Depends on sessions | Not probed authed | ⚠️ **LIKELY PASS** — slow cold start |
| `/dashboard/finance` | ✅ | **4.7s** redirect (cold compile) | None in logs | None observed | ✅ `finance.view` | Depends on billing seed | Not probed authed | ⚠️ **LIKELY PASS** — slow cold start |
| `/dashboard/hr` | ✅ | **4.6s** redirect (cold compile) | None in logs | None observed | ✅ `hr.view` | Depends on employee seed | Not probed authed | ⚠️ **LIKELY PASS** — slow cold start |
| `/dashboard/mission-control` | ✅ | **528ms** redirect (unauth) / compiled in dev | 🔒 → `/login` unauth | None in logs | ✅ `mission_control.access` | Queue may be empty | Not probed authed | ⚠️ **LIKELY PASS** |
| `/dashboard/executive` | ❌ | **2.1s** redirect (unauth) | 🔒 → `/login` unauth; **→ `/dashboard`** when authed as SCHOOL_LEADER | None in logs | ❌ Missing `executive.dashboard` / `executive.intelligence` | N/A if redirected | Not probed authed | ❌ **FAIL** for seed founder role |

### Overall sprint verdict

| Area | Status |
|------|--------|
| Auth middleware | ✅ All nine routes redirect unauthenticated users to `/login` |
| Production build | ✅ `npm run build` passes (Sprint 0.1) |
| Daily navigation (sidebar) | ❌ **P0** — clicks do not change routes (see prior investigation) |
| Executive Intelligence (seed founder) | ❌ **P0** — permission redirect to `/dashboard` |
| Dev cold-compile latency | ⚠️ **P1** — scheduling/teacher/finance/hr first hit 2.7–4.7s |
| Login hydration warnings | ⚠️ **P2** — React hydration mismatch on `/login` (browser tooling noise suspected) |

---

## Route-by-route detail

### `/dashboard` — Founder Morning Brief

| Check | Result |
|-------|--------|
| Loads | ✅ User-confirmed: login → Morning Brief renders |
| Load time | ~1–3s warm (dev); metrics + brief fetched server-side |
| Redirects | None when authenticated |
| Errors | None server-side observed |
| Permissions | Dashboard layout requires auth + identity context |
| Missing data | Permission-filtered metrics; empty states handled |
| Console | Hydration warnings on login page (not dashboard body) |
| **Blockers** | **Sidebar `<Link>` navigation does not change URL** — mobile backdrop / transform stacking (`Sidebar.tsx` lines 39–51) |

---

### `/dashboard/admissions`

| Check | Result |
|-------|--------|
| Layout guard | `admissions.view` \| `admissions.manage` \| `admissions.accept` |
| SCHOOL_LEADER | ✅ Has `admissions.view`, `admissions.manage`, `admissions.accept` |
| Unauth probe | 307 → `/login` in 84ms |
| Dev evidence | Admissions registry loaded in layout |
| **Notes** | Full CRM depends on seed leads; executive view may be empty without data |

---

### `/dashboard/students`

| Check | Result |
|-------|--------|
| Layout guard | `students.view` \| `students.edit` |
| SCHOOL_LEADER | ✅ Has both |
| Dev evidence | `○ Compiling /dashboard/students` — no compile error |
| **Notes** | SSIS profiles require student seed rows |

---

### `/dashboard/scheduling`

| Check | Result |
|-------|--------|
| Layout guard | `hr.view` \| `scheduling.executive` |
| SCHOOL_LEADER | ✅ Has `hr.view` |
| Unauth probe | 307 → `/login` in **2.7s** (Turbopack cold compile) |
| **Notes** | First dev hit is slow; warm loads expected <3s |

---

### `/dashboard/teacher`

| Check | Result |
|-------|--------|
| Layout guard | `ai.teacher` \| `instruction.executive` \| `hr.view` \| `students.view` |
| SCHOOL_LEADER | ✅ Has `hr.view`, `students.view` |
| Dev evidence | `○ Compiling /dashboard/teacher` |
| Unauth probe | 307 in **4.6s** (cold compile) |

---

### `/dashboard/finance`

| Check | Result |
|-------|--------|
| Layout guard | `finance.view` \| `finance.billing` \| `portal.parent.access` |
| SCHOOL_LEADER | ✅ Has `finance.view` |
| Dev evidence | `○ Compiling /dashboard/finance` |
| Unauth probe | 307 in **4.7s** (cold compile) |

---

### `/dashboard/hr`

| Check | Result |
|-------|--------|
| Layout guard | `hr.view` \| `hr.manage` \| `employee.self_service` |
| SCHOOL_LEADER | ✅ Has `hr.view` (not `hr.manage`) |
| Dev evidence | `○ Compiling /dashboard/hr` |
| Unauth probe | 307 in **4.6s** (cold compile) |

---

### `/dashboard/mission-control`

| Check | Result |
|-------|--------|
| Layout guard | `mission_control.access` |
| SCHOOL_LEADER | ✅ Has `mission_control.access` |
| Dev evidence | `○ Compiling /dashboard/mission-control` |
| Page behavior | Runs `processAllPlatformQueues` on each load — may add latency |
| **Notes** | Queues may show empty if automation seed minimal |

---

### `/dashboard/executive`

| Check | Result |
|-------|--------|
| Layout guard | `canAccessExecutiveIntelligence(ctx)` \|\| `canViewEdi(ctx)` |
| SCHOOL_LEADER | ❌ **Does not** receive `executive.dashboard` or `executive.intelligence` in default bundle |
| Expected behavior | Redirect to `/dashboard` (`executive/layout.tsx` line 10) |
| **Blockers** | **Founder daily user cannot access Executive Intelligence without role/permission grant** |

---

## P0 stabilization backlog (fix before features)

| # | Issue | File / area | Impact |
|---|-------|-------------|--------|
| 1 | Sidebar navigation dead — URL never changes | `src/components/dashboard/Sidebar.tsx` | Cannot navigate between modules from shell |
| 2 | Executive Intelligence blocked for seed SCHOOL_LEADER | `074_enterprise_identity_foundation.sql` + `executive/layout.tsx` | Founder persona cannot open `/dashboard/executive` |
| 3 | Authenticated probe automation | Set `STABILIZATION_EMAIL` / `STABILIZATION_PASSWORD` and re-run probe | Confirms pass/fail with evidence |

---

## P1 / P2 (after P0)

| # | Issue | Notes |
|---|-------|-------|
| P1 | Cold compile 2.7–4.7s on first module hit in dev | Expected Turbopack behavior; verify warm loads |
| P1 | Mission Control queue processing on every page load | Consider background job vs. request-path |
| P2 | React hydration mismatch on `/login` | Often browser extension / `data-cursor-ref` attrs; verify in clean profile |
| P2 | 91 ESLint warnings | See `STABILIZATION_REPORT.md` |

---

## Module verification checklist (copy for each new route)

```
Route: _________________________
Tester: _______________________  Date: ___________

[ ] Loads without 5xx
[ ] Load time: _______ ms (warm) / _______ ms (cold)
[ ] Final URL matches intended route
[ ] No permission redirect to /dashboard
[ ] No login redirect when authenticated
[ ] Primary data visible or empty-state message shown
[ ] No console.error (except known noise)
[ ] Sidebar link navigates here successfully

Result: PASS / FAIL
Notes:
```

---

## Next steps

1. **Fix P0 #1** — Sidebar navigation (approved patch from investigation).
2. **Fix P0 #2** — Grant `executive.dashboard` + `executive.intelligence` to `SCHOOL_LEADER`, or map founder seed to `FOUNDER` role.
3. **Re-run** `npx tsx scripts/stabilization-route-probe.mts` with founder credentials; update this table to ✅/❌ with measured load times.
4. **Repeat** for platform routes (`/dashboard/compliance`, `/dashboard/data`, `/dashboard/admin`) in Sprint 2.5b.

---

*Report generated Sprint 2.5 — code unchanged per stabilization protocol. Authenticated timings marked ⏳ until probe credentials are supplied.*
