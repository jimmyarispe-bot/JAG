# Build Reconciliation — Platform Dependency Graph

Date: 2026-07-31
Branch: `release/ga-certification`
Goal: eliminate Vercel "Module not found" failures by fixing **root packages / aliases**, not individual consumers.

## Method

1. Scan TypeScript/TSX imports (`@/`, `@learning-intelligence`, relative) against the Git index.
2. Group unresolved imports by missing root module.
3. Classify each group: **A** uncommitted package, **B** incomplete barrel, **C** wrong/missing path alias, **D** rename, **E** stale import.
4. Repair the root only; re-run `npm run build` until exit 0.

## Root causes repaired

| Root module | Class | Cause | Fix |
|---|---|---|---|
| `@/lib/platform/automation/operating` | **A** | Package existed locally; never committed | Commit entire `operating/` tree (barrel + engine) |
| `@/lib/portal/student-directory` | **A** | Module existed locally; never committed | Commit `student-directory.ts` |
| `@learning-intelligence` | **C** | Package tracked under `packages/platform/learning-intelligence`; `tsconfig` / Vitest aliases not committed | Commit path aliases in `tsconfig.json` + `vitest.config.ts` |
| `@/lib/platform/identity/mfa-actions` | **A** | Server actions existed locally; never committed | Commit `mfa-actions.ts` |
| `@/lib/platform/identity/password-reset-actions` | **A** | Server actions existed locally; never committed | Commit `password-reset-actions.ts` |
| `@/lib/platform/profile/register-kinds` | **A** | Side-effect registration split out; file untracked | Commit `register-kinds.ts` + profile barrel import |
| `@/lib/jag-command-center/tenant-admin` | **A** | Package existed locally; barrel re-export uncommitted | Commit `tenant-admin/` + export from command-center index |
| `JagMemoryView` inline `"use server"` | boundary | Client/RSC form used inline server action | Move FormData entrypoint to `memory/actions.ts` as `jagRecordLessonFormAction` |

No consumer import rewrites were required for the Module-not-found groups (A/C). No stale imports (E) or renames (D) found for these roots. Barrels were already complete once the packages were present (B N/A).

## Affected modules (consumers — not edited for resolution)

- **operating:** founder workspace/panels, persistence, workflows framework, intelligence tests
- **student-directory:** portal layout / forms / messages / progress / student goals and achievements
- **@learning-intelligence:** learning API routes, executive and school-leader summaries, portal learning experience
- **identity actions:** login MFA / forgot-password forms (when wired)
- **tenant-admin:** jag-command-center public barrel
- **register-kinds:** platform profile bootstrap

## Files repaired / added

### Added (previously untracked)

- `src/lib/platform/automation/operating/*` (11 files)
- `src/lib/portal/student-directory.ts`
- `src/lib/platform/identity/mfa-actions.ts`
- `src/lib/platform/identity/password-reset-actions.ts`
- `src/lib/platform/profile/register-kinds.ts`
- `src/lib/jag-command-center/tenant-admin/*` (3 files)

### Updated

- `tsconfig.json` — `@learning-intelligence` / `@learning-intelligence/*`
- `vitest.config.ts` — `@learning-intelligence` alias
- `src/lib/platform/profile/index.ts` — import `register-kinds`
- `src/lib/jag-command-center/index.ts` — export `tenant-admin`
- `src/lib/jag-command-center/memory/actions.ts` — `jagRecordLessonFormAction`
- `src/lib/jag-command-center/memory/index.ts` — export form action
- `src/components/jag/command-center/memory/JagMemoryView.tsx` — import form action (no inline `"use server"`)

## Verification

| Check | Result |
|---|---|
| `npm run build` | **Exit code 0** |
| Module-not-found in build log | None |
| Import scan after staging | No remaining **UNTRACKED** / **ALIAS_UNCOMMITTED** roots for app imports |
| Required source packages for resolved groups | Present in Git index (staged then committed) |

## Remaining warnings (non-blocking)

- npm `Unknown env config "devdir"` (local npmrc / environment)
- Platform release/security/docs validators emit module posture warn lines (Admissions, Billing, Scholarships, etc.) — unrelated to module resolution
- Release registry score WARN lines during validate steps — unrelated to dependency graph
- Codegen scripts contain template-literal import strings that are not real runtime imports — ignored by this reconciliation

## Policy going forward

Treat "Module not found" on Vercel as a **repository completeness** failure: locate the missing root package or alias, commit that root, do not patch consumers one-by-one.
