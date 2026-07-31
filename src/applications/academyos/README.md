# AcademyOS Application Package

AcademyOS is a **plug-in** to JAG. It registers domain configuration through platform frameworks. It does not modify the platform.

```text
JAG (platform)
 └── AcademyOS (this package)
```

## Entry points

| File | Role |
|------|------|
| `manifest.ts` | `ApplicationManifest` via SDK |
| `bootstrap.ts` | Sole registration orchestrator |
| `index.ts` | Public exports |

## Phase status

- **Phase 1:** Domain model registrations (schemas, workflows, forms, catalogs).
- **Phase 2:** Application runtime — facades, domain services, repository contracts, adapters.
- **Phase 3:** Composition root — providers, null repository bindings, test container.
- **Phase 4:** Infrastructure — Database/Storage/Email/… providers + Supabase repository implementations.

Docs: `docs/applications/academyos/` (+ `12_COMPOSITION.md`, `13_INFRASTRUCTURE.md`).

## Resolve services

```ts
import { startAcademyOS, resolveAcademyService } from "@/applications/academyos";

startAcademyOS();
const students = resolveAcademyService("students");
```

## Rules

1. No platform imports of `@/applications/academyos`.
2. No Academy-only fixes inside `src/lib/platform/` — see governance rule.
3. Screens call `resolveAcademyService` / application DTOs only — never construct services.
4. Framework registration + composition via `startAcademyOS()`.
5. Platform access only via adapters bound in `composition/`.
6. Repository swaps happen only in `composition/repositories.ts`.

## Boot

```ts
import { bootstrapAcademyOS } from "@/applications/academyos";

bootstrapAcademyOS();
```
