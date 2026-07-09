# Sprint 0.1 — Build Stabilization Completion

**Document:** `SPRINT0_COMPLETION.md`  
**Sprint:** 0.1 — Eliminate Build Errors  
**Date:** July 5, 2026  
**Repository:** `school-platform` (The JAG OS)

---

## Outcome

| Check | Before | After |
|-------|--------|-------|
| `npm run build` | **FAIL** (validators + Turbopack) | **PASS** |
| `npm run typecheck` (app `tsc --noEmit`) | **FAIL** (48 errors) | **PASS** |
| `npm run lint` (errors) | **24 errors** | **0 errors** |
| `npm run lint` (warnings) | 89 warnings | 91 warnings |

Build errors reduced from **24 → 0**. Warnings were out of scope for this sprint.

---

## Files Changed (Sprint 0.1 fixes)

### TypeScript — PAJ / platform integration

| File | Fix |
|------|-----|
| `src/lib/platform/paj/recommendations.ts` | Aligned `EvaluateRuleSetInput` / `ExecuteDecisionInput` / result property names |
| `src/lib/platform/paj/integration/events.ts` | `actorUserId` → `actorId` on `PublishEventInput` |
| `src/lib/platform/operational-loop/orchestrate.ts` | `actorId` on events; `primaryOutcome.outcomeKey` |
| `src/lib/platform/operational-loop/recovery.ts` | `actorId` on events |
| `src/lib/platform/operational-loop/actions.ts` | Form action return type `Promise<void>` |
| `src/lib/instruction/canonical-progress.ts` | Domain enrollment lookup for active competency; evidence/audit types |
| `src/lib/teacher/actions.ts` | Active competency from domain enrollments |
| `src/lib/platform/automation/types.ts` | Added `learning_progress`, `parent_communication` modules |

### TypeScript — JAG Work / WDS / XES

| File | Fix |
|------|-----|
| `src/lib/platform/jag-work/types.ts` | Added `"scheduling"` to `JagWorkItem.source` union |
| `src/lib/platform/jag-work/resolve-teacher-work.ts` | Imported `JagWorkPerspective` |
| `src/lib/platform/automation/mission-control-compose.ts` | `jagWork.allItems` (was `.items`) |
| `src/components/workspace-design-system/pipeline/execution-steps.ts` | Exported pipeline orientation/step types |
| `src/components/experience-system/navigation/index.tsx` | Re-exported `useKeyboardShortcuts`, `XesNotification`; lazy storage init |
| `src/lib/platform/ulr/catalog/structured-literacy/index.ts` | Fixed `SL_ALL_ATOMIC_SKILLS` export path |

### TypeScript — UI / React

| File | Fix |
|------|-----|
| `src/components/executive/OperationalLoopDashboard.tsx` | *(via actions)* form action typing |
| `src/components/teacher/instruction/InstructionDeliveryPanel.tsx` | String casts for artifact fields |
| `src/components/students/profile/panels/StudentProfilePanels.tsx` | Ternary for `unknown` family guard |
| `src/components/students/profile/sections/StudentSectionViews.tsx` | Ternary for `unknown` phone field |
| `scripts/import-doc98-pa-catalog.mts` | Typed `keys` array as `string[]` |

### Build failure — client/server boundary

| File | Fix |
|------|-----|
| `src/lib/instruction/continuous-improvement-parse.ts` | **New** — client-safe parse helpers |
| `src/lib/instruction/continuous-improvement.ts` | Split server imports from parse module |
| `src/components/teacher/SessionWorkspaceForm.tsx` | Import parse from client-safe module |

### Build failure — hierarchy validator

| File | Fix |
|------|-----|
| `src/lib/platform/hierarchy/catalog/reference-definitions.ts` | Added `jag.standard.instructional_delivery` node |

### ESLint errors (24 → 0)

| Category | Files |
|----------|-------|
| `prefer-const` (10) | `configuration/actions`, `executive/risk-intelligence`, `finance/dashboards`, `instruction/effectiveness`, `automation/triggers/workflow-trigger`, `jag-organization/resolve`, `scheduling/queries`, `platform-paj.test` |
| `react-hooks/purity` (8) | `cloud/customers`, `intelligence/policies`, `intelligence/prompts`, `SchedulingPageContent`, `portal/calendar`, `GenerateSessionsButton` |
| `react-hooks/set-state-in-effect` (4) | `experience-system/forms`, `experience-system/navigation`, `PortalShell` |
| `@next/next/no-html-link-for-pages` (2) | `apply/portal/[applicationId]`, `portal/page` |
| `react/no-unescaped-entities` (1) | `teacher/students/[id]` |

---

## Errors Fixed (by category)

1. **TypeScript (48 app errors)** — PAJ API mismatches, JAG Work types, WDS pipeline exports, XES navigation exports, ULR export, React `unknown` nodes, form action types, active competency lookup, platform module unions, import script typing.
2. **Missing imports (5)** — `JagWorkPerspective`, WDS step types, `useKeyboardShortcuts`, `XesNotification`, `SL_ALL_ATOMIC_SKILLS`.
3. **Build failures (2)** — Hierarchy unknown node; Turbopack client bundle importing `next/headers` via continuous-improvement chain.
4. **Invalid hooks / React (12 ESLint)** — Date.now purity, setState-in-effect, Link vs `<a>`, unescaped apostrophe.
5. **ESLint prefer-const (10)** — Auto-fixed.

---

## Remaining Warnings (91)

Warnings were **not** in sprint scope. Top areas unchanged from audit:

- `@typescript-eslint/no-unused-vars` in intelligence-graph providers, automation AI, executive command-center, scheduling academy-way, test helpers
- Additional unused-variable warnings introduced in `finance/dashboards.ts` and `scheduling/queries.ts` after `prefer-const` auto-fix (variables now assigned but unused)

**Note:** `npm run typecheck` still reports errors in `tsconfig.test.json` integration tests (mock Supabase typing). App source and production build pass.

---

## Risks Introduced

| Risk | Severity | Notes |
|------|----------|-------|
| Hidden form keys removed | Low | Unique keys now generated in server actions (`Date.now()` at submit time) — same behavior, different timing |
| `retryLoopTransitionAction` no longer returns result to caller | Low | Only used as form action; errors not surfaced in UI |
| Active competency resolved from enrollments | Low | Corrects incorrect `PajJourneyRecord.active_competency_key` assumption; matches `getJourneySnapshot` |
| Client parse module split | Low | Must keep server-only imports out of `continuous-improvement-parse.ts` |
| New hierarchy node | Low | Scheduling capabilities now bind to published standard |

---

## Recommended Next Sprint (Sprint 0.2)

1. **Fix integration test typecheck** — Extend `tests/helpers/mock-supabase.ts` to satisfy `SupabaseClient` or use typed test doubles.
2. **Regenerate `database.ts`** for Phase 2 tables (ULR, PAJ, graph, events) per stabilization queue item 4.
3. **Reduce ESLint warnings** — Target intelligence-graph providers and automation unused params (`_options` prefix or removal).
4. **Branch hygiene** — Reconcile WIP with `origin/main`; define feature branch strategy for Phase 2 modules.
5. **Consolidation prep** — Begin Founder's Edition nav gating (Cloud/Ops/AIP duplicates) without deleting routes.

---

*See updated `STABILIZATION_REPORT.md` for post-sprint status.*
