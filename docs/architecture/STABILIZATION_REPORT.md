# Platform Stabilization Report

**Document:** `STABILIZATION_REPORT.md`  
**Prepared by:** Lead Engineer (Sprint 0 — Tasks 2, 3, 5)  
**Date:** July 5, 2026  
**Repository:** `school-platform` (The JAG OS)  
**Source documents:** `CURRENT_ARCHITECTURE_REPORT.md`, `FOUNDERS_EDITION_BUILD_PLAN.md`

---

## Executive Summary

| Check | Result | Blocker? |
|-------|--------|----------|
| `npm install` | **PASS** | No |
| `npm run lint` | **PASS** — 0 errors, 91 warnings | No (CI errors cleared) |
| `npm run typecheck` (app) | **PASS** — `tsc --noEmit` | No |
| `npm run typecheck` (full) | **FAIL** — integration test mock typing | Yes (test CI only) |
| `npm run build` | **PASS** — all validators + `next build` | No |

**Sprint 0.1 completed July 5, 2026.** See `SPRINT0_COMPLETION.md`.

**Original root cause clusters (resolved in Sprint 0.1):**
1. ~~**Uncommitted Phase 2 WIP**~~ — Type integration gaps closed for PAJ, JAG Work, WDS/XES, ULR exports.
2. ~~**Hierarchy registry validation**~~ — `jag.standard.instructional_delivery` node added.
3. ~~**ESLint React 19 purity rules**~~ — All 24 ESLint errors fixed.
4. **Architectural duplication** — Unchanged; deferred to Founder's Edition consolidation.

**Remaining:**
- 91 ESLint warnings (out of Sprint 0.1 scope)
- Integration test TypeScript errors in `tsconfig.test.json`
- Architectural duplication inventory (Task 3) still valid for Sprint 1+

---

## Task 2 — Build & Quality Audit

### Environment

| Item | Value |
|------|-------|
| OS | Windows 10.0.26200 |
| Node | npm 11.13.0 |
| Branch analyzed | `main` (local, with uncommitted WIP) |
| Date | July 5, 2026 |

---

### 2.1 `npm install`

**Result: PASS**

```
up to date, audited 412 packages in 7s
2 moderate severity vulnerabilities
```

| Finding | Severity | Notes |
|---------|----------|-------|
| 2 moderate npm audit vulnerabilities | Low | `npm audit fix --force` suggested; not run |
| `npm warn Unknown env config "devdir"` | Info | Local npm config; non-blocking |

---

### 2.2 `npm run lint`

**Result: PASS (Sprint 0.1)** — Exit code 0 — **0 errors**, 91 warnings

#### Errors by Category — **RESOLVED**

All 24 errors fixed in Sprint 0.1. Original categories:

| Rule | Count | Status |
|------|-------|--------|
| `react-hooks/purity` | 8 | Fixed |
| `react-hooks/set-state-in-effect` | 4 | Fixed |
| `@next/next/no-html-link-for-pages` | 2 | Fixed |
| `react/no-unescaped-entities` | 1 | Fixed |
| `prefer-const` | 9 | Fixed |

#### Full Error File List

| # | File | Line | Rule |
|---|------|------|------|
| 1 | `src/app/apply/portal/[applicationId]/page.tsx` | 72 | `no-html-link-for-pages` |
| 2 | `src/app/cloud/customers/page.tsx` | 28 | `react-hooks/purity` |
| 3 | `src/app/dashboard/intelligence/policies/page.tsx` | 26 | `react-hooks/purity` |
| 4 | `src/app/dashboard/intelligence/policies/page.tsx` | 40 | `react-hooks/purity` |
| 5 | `src/app/dashboard/intelligence/policies/page.tsx` | 35 | `react-hooks/purity` |
| 6 | `src/app/dashboard/scheduling/SchedulingPageContent.tsx` | 65 | `react-hooks/purity` |
| 7 | `src/app/dashboard/teacher/students/[id]/page.tsx` | 92 | `react/no-unescaped-entities` |
| 8 | `src/app/portal/calendar/page.tsx` | 14 | `react-hooks/purity` |
| 9 | `src/app/portal/page.tsx` | 24 | `no-html-link-for-pages` |
| 10 | `src/components/experience-system/forms/index.tsx` | 46 | `react-hooks/set-state-in-effect` |
| 11 | `src/components/experience-system/navigation/index.tsx` | 79 | `react-hooks/set-state-in-effect` |
| 12 | `src/components/experience-system/navigation/index.tsx` | 103 | `react-hooks/set-state-in-effect` |
| 13 | `src/components/portal/PortalShell.tsx` | 120 | `react-hooks/set-state-in-effect` |
| 14 | `src/components/scheduling/GenerateSessionsButton.tsx` | 30 | `react-hooks/purity` |
| 15 | `src/lib/configuration/actions.ts` | 91 | `prefer-const` |
| 16 | `src/lib/executive/risk-intelligence.ts` | 23 | `prefer-const` |
| 17 | `src/lib/finance/dashboards.ts` | 10 | `prefer-const` |
| 18 | `src/lib/instruction/effectiveness.ts` | 70 | `prefer-const` |
| 19 | `src/lib/platform/automation/triggers/workflow-trigger.ts` | 13 | `prefer-const` |
| 20 | `src/lib/platform/jag-organization/resolve.ts` | 25 | `prefer-const` |
| 21 | `src/lib/scheduling/queries.ts` | 6 | `prefer-const` |
| 22–24 | `tests/integration/platform-paj.test.ts` | 110, 143, 156 | `prefer-const` |

#### Warning Hotspots (Top 5 by area)

| Area | Warning Count (approx.) | Common Rule |
|------|------------------------|-------------|
| `src/lib/platform/intelligence-graph/providers/` | 6 | `@typescript-eslint/no-unused-vars` (`_options`) |
| `src/lib/platform/automation/ai.ts` | 6 | `no-unused-vars` (`_req`) |
| `src/lib/executive/command-center.ts` | 3 | `no-unused-vars` |
| `src/lib/scheduling/academy-way.ts` | 4 | `no-unused-vars` |
| `tests/helpers/mock-supabase.ts` | 5 | `no-unused-vars` |

---

### 2.3 `npm run typecheck`

**Result: PASS (app)** — `tsc --noEmit` exit 0 after Sprint 0.1

**Result: FAIL (tests)** — `tsconfig.test.json` — mock Supabase client typing (integration tests)

Original audit: **48 app errors** — all resolved. Representative fixes:

- PAJ: `EvaluateRuleSetInput`, `ExecuteDecisionInput`, `DecisionResult`, `RuleEvaluationResult` property alignment
- JAG Work: `"scheduling"` source union, `JagWorkPerspective` import, `JagWorkQueue.allItems`
- WDS: pipeline step type exports
- XES: `useKeyboardShortcuts`, `XesNotification` re-exports
- ULR: `SL_ALL_ATOMIC_SKILLS` export path
- Instruction: active competency from domain enrollments; client/server split for continuous improvement

---

### 2.4 `npm run build`

**Result: PASS (Sprint 0.1)** — Exit code 0

#### Pre-build Validators — all pass

| Script | Result |
|--------|--------|
| `validate:platform` | **PASS** |
| `validate:admissions` | **PASS** |
| `validate:workflow` | **PASS** |
| `validate:decision` | **PASS** |
| `validate:events` | **PASS** |
| `validate:intelligence-graph` | **PASS** |
| `validate:automation` | **PASS** |
| `validate:ulr` | **PASS** |
| `validate:hierarchy` | **PASS** — after adding `jag.standard.instructional_delivery` |
| `validate:execution-engine` | **PASS** |
| `next build` | **PASS** — 245 routes |

#### Original `validate:hierarchy` Failures — **RESOLVED**

Added node `jag.standard.instructional_delivery` to `reference-definitions.ts`.

---

## Task 3 — Duplicate Implementations

Duplicates ranked by consolidation impact for Founder's Edition. Source: `CURRENT_ARCHITECTURE_REPORT.md` §11, codebase grep, and `FOUNDERS_EDITION_BUILD_PLAN.md` §3.

### Critical

| Duplicate | Locations | Overlap | Consolidation Target |
|-----------|-----------|---------|---------------------|
| **Cloud Console vs Operations Center** | `/cloud/*` (22 pages), `/operations/*` (23 pages); `src/lib/cloud-platform/`, `src/lib/operations-platform/` | Near-mirror: dashboard, analytics, billing, customers, incidents, marketplace, licenses, releases, subscriptions, support | Single `PlatformOpsShell` with tenant-mode toggle; defer both from Founder's nav |
| **Triple command center surfaces** | `MissionControlView` + `getMissionControlDashboard()`; `CommandCenterDashboard` + `getCommandCenterMetrics()`; Executive Home `StatCard` + `getDashboardMetrics()` | All show organizational health metrics with overlapping enrollment, compliance, and alert data | **JAG Mission Control** as primary; single metrics aggregation service |
| **Parallel recommendation / intelligence engines** | EDI (`src/lib/edi/recommendation-engine.ts`); AIN (`src/lib/intelligence-network/recommendation-engine.ts`); Platform Decision (`src/lib/platform/decision/`); Executive Insights (`src/lib/executive/insights.ts`); Scheduling Intelligence (`src/lib/scheduling/intelligence.ts`) | Same "generate recommendations from data" pattern with separate scoring, persistence, and UI routes | Platform Decision Engine as interface; EDI/AIN as providers |
| **Distributed intelligence product modules** | Mission Control, EDI, Executive, AIP, AIN, Financial Intelligence, Integration Hub command center | Each has own hub, nav, panels, automation sync to Mission Control | Founder's Edition: executive-embedded decisions + Mission Control only |

### High

| Duplicate | Locations | Overlap |
|-----------|-----------|---------|
| **Hub / Nav / Panel pattern (12×)** | `ExecutiveNav`, `AipNav`, `AinNav`, `EdpNav`, `IntHubNav`, `CertNav`, `CloudNav`, `OpsNav`, `ConfigStudioNav` + matching `*Panels.tsx` | Identical shell structure reimplemented per product area |
| **Finance Operations + Financial Intelligence** | `src/lib/finance/` vs `src/lib/financial-intelligence/`; routes `/dashboard/finance` vs `/dashboard/finance/intelligence` vs `/dashboard/finance/executive` | Split analytics from operations with bridge page `IntelligencePageContent.tsx` |
| **Executive Network + AIN Network dashboards** | `/dashboard/executive/network` (`executive/network-dashboard.ts`); `/dashboard/network/*` (`intelligence-network/benchmark-engine.ts`, `AinPanels`) | Duplicate benchmarking and network intelligence UX |
| **Recommendations UI routes** | `/dashboard/executive/recommendations` vs `/dashboard/network/recommendations` | Same user intent — "what should I do next?" |
| **Notification systems (3×)** | `StaffNotificationsBell` (dashboard); `ShellNotifications` / `GlobalShell` (WDS); `PortalNotificationsList` (portal) | Separate notification fetch, render, and preference models |
| **Integration Hub command center** | `/dashboard/integrations/command-center` + `integration-hub/command-center.ts` | Fourth "command center" variant beyond Mission Control and Executive |

### Medium

| Duplicate | Locations | Overlap |
|-----------|-----------|---------|
| **Profile workspace (4× entity copy)** | `students/profile/`, `families/profile/`, `employees/profile/`, `admissions/profile/` | Parallel section registries, envelopes, queries, `ProfilePrimitives` |
| **WDS vs XES card/header duplication** | `workspace-design-system/` vs `experience-system/` | Same card names exported from both; `PageHeader` in `components/ui/` AND `experience-system/framework/PageLayout.tsx` |
| **Work management cluster (5 routes)** | `/dashboard/playbooks`, `projects`, `tasks`, `work`, `workload` | Overlaps with per-module JAG Work queues from `src/lib/platform/jag-work/` |
| **Executive Intelligence view modes** | `ExecutivePageContent.tsx` — work queue (default), `?view=command-center`, `?view=operational-loop` | Three rendering modes for same module entry |
| **Dashboard page composition patterns** | Pattern A (`*PageContent` + Suspense, 11 routes) vs Pattern B (inline async, ~150 routes) | Inconsistent data-fetch and loading behavior |

### Low

| Duplicate | Locations | Notes |
|-----------|-----------|-------|
| **CEO redirect stub** | `/dashboard/ceo` → `/dashboard/executive` | Functional redirect; no duplicate logic |
| **Legacy admin scholarship** | `/admin/scholarships` → `/dashboard/scholarships` | Redirect only |
| **Activity dual-write** | `platform_activity_events` + `platform_timeline_events` + `ihub_events` | Incomplete migration path documented in `platform-services.md` |
| **Deprecated type aliases** | `database.ts` — `prospects` → `admissions_leads` | Naming confusion only |

---

## Task 5 — Dead Code Inventory

Items identified as unused, redirect-only, or architected-but-unenforced. No deletions performed.

### 5.1 Unused Routes (Redirect Stubs & Dev-Only)

| Route | File | Status |
|-------|------|--------|
| `/admin/scholarships` | `src/app/admin/scholarships/page.tsx` | Redirect to `/dashboard/scholarships` — legacy entry |
| `/dashboard/ceo` | `src/app/dashboard/ceo/page.tsx` | Redirect to `/dashboard/executive` — nav stub |
| `/dashboard/workspace-design-system` | `src/app/dashboard/workspace-design-system/page.tsx` | Dev showcase — not in production nav target |
| `/dashboard/certification` | `src/app/dashboard/certification/page.tsx` | Index redirect (to `overview/`) |
| `/dashboard/integrations` | `src/app/dashboard/integrations/page.tsx` | Index redirect (to `dashboard/`) |
| `/dashboard/network` | `src/app/dashboard/network/page.tsx` | Index redirect (to `benchmarks/`) |
| `/dashboard/certification` (root) | Redirect index | Hidden from Founder's nav |

### 5.2 Unused Services / Utilities

| File | Evidence | Risk |
|------|----------|------|
| `src/lib/supabase/server.ts` | `createServerClient()` — **zero imports** from application code; grep finds only self-reference and `server-auth.ts` (which uses `@supabase/ssr` directly) | **High** — service-role key fallback path; security footgun if accidentally adopted |
| `src/lib/platform/identity/mfa.ts` | Tables/settings exist; no enforcement in middleware or login | Architected, not wired |
| `src/lib/platform/identity/sso.ts` | Provider config exists; email/password remains sole auth path | Architected, not wired |
| `src/lib/certification/rc1-stabilization-report.ts` | Untracked file in working tree; no imports found | WIP artifact |

### 5.3 Unused Components (Limited / No External Imports)

| Component | Path | Notes |
|-----------|------|-------|
| `DesignSystemShowcase` | `src/components/workspace-design-system/showcase/DesignSystemShowcase.tsx` | Only consumed by dev showcase route |
| `TeacherTaskPanel` | `src/components/teacher/TeacherTaskPanel.tsx` | Untracked WIP; verify imports before ship |
| `TeacherWorkflowPanel` | `src/components/teacher/TeacherWorkflowPanel.tsx` | Used only in `TeacherTabs.tsx` (untracked WIP chain) |

### 5.4 Unused Hooks

| Finding |
|---------|
| **No `src/hooks/` directory exists.** Client state is inline in components (`"use client"` shells). No shared hook library to audit. |

### 5.5 Stale Type Definitions

| File | Issue |
|------|-------|
| `src/types/database.ts` | Header: "Phase 1 + Sprint 1" — missing Phase 2 tables (ULR, PAJ, graph, AIP, AIN, EDI, events, decisions, evidence, rules). Queries against new tables are untyped. |

### 5.6 Dev Artifacts

| Path | Notes |
|------|-------|
| `supabase/snippets/` | Dev SQL snippets in repo (per architecture report §10.3) |
| `supabase/.temp/linked-project.json` | Local Supabase link metadata |
| `scripts/import-doc98-pa-catalog.mts` | Untracked; typecheck errors — not in build path |

### 5.7 Pages Deferred from Founder's Edition (Not Dead — Gated)

These routes are implemented but targeted for **nav removal** per `FOUNDERS_EDITION_BUILD_PLAN.md` §3.1:

| Surface | Route Count | Module |
|---------|-------------|--------|
| Cloud Console | 22 | `src/app/cloud/` |
| Operations Center | 23 | `src/app/operations/` |
| Full AIP | 10+ | `src/app/dashboard/intelligence/` |
| Standalone AIN | 13+ | `src/app/dashboard/network/` |
| Certification Center | 15 | `src/app/dashboard/certification/` |
| Enterprise Data Platform | 12 | `src/app/dashboard/data/` |
| Integration Hub (full) | 23 | `src/app/dashboard/integrations/` |

---

## Stabilization Priority Queue

Recommended fix order for Sprint 1 (not executed in Sprint 0):

| # | Item | Blocks | Effort |
|---|------|--------|--------|
| 1 | Fix `validate:hierarchy` — add `jag.standard.instructional_delivery` node or rebind scheduling capabilities | `npm run build` | Small |
| 2 | Resolve 48 TypeScript errors in PAJ, JAG Work, operational-loop, WDS/XES integration | `npm run typecheck`, `next build` | Large |
| 3 | Fix 24 ESLint errors (Date.now purity, setState-in-effect, prefer-const) | CI lint gate | Medium |
| 4 | Regenerate or extend `database.ts` for Phase 2 tables | Type safety | Medium |
| 5 | Pull `origin/main` and reconcile local WIP branch strategy | Branch hygiene | Small |
| 6 | Delete merged remote branch `cursor/founder-operating-center-1d86` | Branch hygiene | Trivial |

---

## Appendix — Validator Scripts Reference

From `package.json` build script (run sequentially before `next build`):

```
validate:platform → validate:admissions → validate:workflow → validate:decision →
validate:events → validate:intelligence-graph → validate:automation →
validate:ulr → validate:hierarchy → validate:execution-engine → next build
```

---

*Sprint 0.1 fixes applied July 5, 2026. See `SPRINT0_COMPLETION.md`, `BRANCH_STATUS.md`, `BRANDING_AUDIT.md`.*
