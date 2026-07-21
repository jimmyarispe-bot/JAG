# AcademyOS Module Completion Standard (v2)

A module **cannot be marked complete** unless it passes all applicable gates.

> **Rule:** No new module may be considered complete until it complies with this standard (including the [CRUD Standard](./crud-standards.md)).

## Status model

| Status | Meaning |
|--------|---------|
| `planned` | Registered only |
| `building` | Active development |
| `feature-complete` | Core UX shipped; gates incomplete |
| `crud-complete` | CRUD gate green |
| `workflow-complete` | Lifecycle events reachable by Workflow Engine |
| `ei-complete` | Events registered in Executive Intelligence catalog |
| `tested` | Required unit/lifecycle/permission tests present |
| `production-ready` | Aggregate production gate green |
| `released` | Shipped to production |

Registry: `src/lib/platform/release/registry.ts`  
Effective status may be **lower** than declared after gate evaluation.

## Gates

| # | Gate | Validator |
|---|------|-----------|
| 1 | CRUD | `npm run validate:crud` |
| 2 | Security (RLS, permissions, server actions) | `npm run validate:security` |
| 3 | Workflow (lifecycle → triggers) | `npm run validate:workflow` |
| 4 | Executive Intelligence | `npm run validate:ei` |
| 5 | Audit | included in release evaluate |
| 6 | Communications | included when relevant |
| 7 | Documentation (`docs/features/<module>.md`) | `npm run validate:docs` |
| 8 | Testing | `npm run validate:tests` |
| 9 | Accessibility | cert + shared CRUD a11y patterns |
| 10 | Mobile | overflow menus / touch targets |
| 11 | Performance | pagination / indexes / loading |
| 12 | Extension | provider adapters, not hard-coded vendors |
| 13 | UX Consistency | shared CRUD kit + design system |
| 14 | Production | TypeScript / tests / docs / migrations claim |

## Build validation

```bash
npm run validate:crud
npm run validate:security
npm run validate:workflow
npm run validate:ei
npm run validate:docs
npm run validate:tests
npm run validate:ux
npm run validate:production
npm run validate:release   # aggregates Module Completion Standard v2
```

`npm run build` runs platform validators including `validate:crud` and `validate:release`.

## Release Dashboard

Founder / Executive Intelligence:

**`/dashboard/executive/release`**

Shows every module and gate readiness at a glance (CRUD, Security, Workflow, EI, Tests, Docs, Production).

## Declaring a module complete

1. Implement all applicable gates.
2. Advance `status` in `MODULE_RELEASE_REGISTRY` only when validators pass.
3. Keep `ENTITY_RELEASE_STATUS` (CRUD) aligned for owned entities.
4. Run `npm run validate:release`.
