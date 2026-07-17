# IAM Foundation (Sprint 014)

| Field | Value |
|-------|--------|
| **Document** | Identity & Access Foundation |
| **Module** | `@/lib/platform/iam` |
| **Status** | Canonical platform infrastructure |
| **Related** | [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) · [SECURITY_MODEL.md](./SECURITY_MODEL.md) · [ENGINEERING_STANDARDS.md](./ENGINEERING_STANDARDS.md) |

---

## Purpose

Product-agnostic Identity & Access infrastructure for the JAG Platform. This module must not import or encode AcademyOS- or application-specific routes, redirects, or product gates.

Application adapters (e.g. `@/lib/platform/identity`) may consume IAM and apply product catalogs (`JAG_ACCESS`, finance gates, etc.).

---

## Module map

```text
src/lib/platform/iam/
├── di.ts                 # createIamPlatform() — DI factory
├── types.ts              # Shared IAM types
├── organizations/        # Entity, settings, lifecycle, isolation
├── identity/             # Users, profiles, auth port, sessions
├── roles/                # System / organization / custom roles
├── permissions/          # Registry, groups, inheritance
├── authorization/        # authorize / hasPermission / requirePermission
├── delegation/           # Temporary authority + expiry + revoke
├── break-glass/          # Emergency access + approval + immutable audit
└── audit/                # Pluggable audit emitter
```

---

## Dependency injection

```ts
import { createIamPlatform } from "@/lib/platform/iam";

const iam = createIamPlatform({
  now: () => new Date(),
  createId: (prefix) => `${prefix}-test`,
  auditAllDecisions: false,
});
```

All services accept injectable `now`, `createId`, and share a single `AuthorizationEngine` + `IamAuditEmitter`.

---

## Authorization

| API | Behavior |
|-----|----------|
| `authorize(snapshot, permission)` | Permission-set membership only |
| `hasPermission(subject, permission)` | Subject → snapshot → authorize |
| `requirePermission(subject, permission)` | Throws `PermissionDeniedError` on deny |

**Roles are never authorization inputs.** Roles expand into permission groups → permissions via inheritance.

Every decision can emit audit events when an `IamAuditEmitter` is wired (`auditAllDecisions` or denials by default).

---

## Temporary authority overlays

```text
base permissions (roles)
  ∪ active delegation permissions
  ∪ active break-glass permissions
  → IamAuthzSnapshot
```

- **Delegation:** grantor must hold each delegated permission; reason + expiry required; revoke + auto-expire.
- **Break glass:** request → approve/deny (separation of duties) → activate → auto-expire; immutable audit trail.

`createIamPlatform().buildSubjectSnapshot({ userId, organizationId })` applies overlays.

Middleware `loadAuthzSnapshot` merges DB overlays from `iam_delegations` / `iam_break_glass_sessions` when those tables exist.

---

## Persistence

Migration: `supabase/migrations/170_sprint014_iam_foundation.sql`

| Table | Purpose |
|-------|---------|
| `iam_delegations` | Temporary delegated authority |
| `iam_break_glass_sessions` | Emergency sessions + workflow |
| `iam_audit_events` | Append-oriented audit; immutable rows guarded by trigger |

---

## Product boundary

| In IAM | Outside IAM (adapters) |
|--------|-------------------------|
| Generic permissions (`iam.*`, `org.*`, `users.*`) | `JAG_ACCESS`, `ACADEMYOS_ACCESS`, finance product gates |
| Tenant isolation helpers | Product route maps / redirects |
| Delegation & break glass | Admin UI modules (later sprints) |

---

## Tests

```bash
npx vitest run tests/unit/iam
```

Covers authorization engine, permission inheritance, delegation lifecycle, break-glass workflow, and tenant isolation.
