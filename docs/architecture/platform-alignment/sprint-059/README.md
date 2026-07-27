# Sprint 059 — Application Registry & Enablement

| Field | Value |
|-------|--------|
| **Sprint** | 059 — Application Registry & Enablement (platform architecture track) |
| **Parent** | [Sprint 057 migration Phase 1](../02_MIGRATION_PLAN.md) |
| **Mode** | Data model + metadata only (**no UI / no user-facing behavior**) |
| **Migration** | `supabase/migrations/200_sprint059_application_registry.sql` |
| **Code** | `src/lib/platform/applications/` |

---

## Numbering note

Intelligence roadmap **Sprint 059 — Collective Intelligence** is a different track. Cite **Sprint 059 Application Registry** vs **Sprint 059 Collective Intelligence**.

---

## Package

| Doc | Role |
|-----|------|
| [00_SPRINT_059_EXECUTIVE_SUMMARY.md](./00_SPRINT_059_EXECUTIVE_SUMMARY.md) | Goals, non-goals, success criteria |
| [01_APPLICATION_REGISTRY.md](./01_APPLICATION_REGISTRY.md) | Tables, seeds, soft default, TS surface |

---

## Conceptual model after this sprint

```text
Platform
    JAG

Applications
    AcademyOS

Tenant
    The Academy Way   (slug: the-academy-way)

Enabled Applications
    AcademyOS
```

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| `platform_applications` catalog exists | ✅ Migration 200 |
| Application #1 = AcademyOS seeded | ✅ key `academyos` |
| Tenant enablement table exists | ✅ `organization_applications` |
| All existing orgs get AcademyOS enabled | ✅ Seed in migration |
| Tenant #1 tagged in enablement metadata | ✅ slug `the-academy-way` |
| Soft default when rows missing | ✅ `resolveEnabledApplicationKeys` |
| No UI / nav / permission call-sites | ✅ Intentional |
| Unit tests for soft default | ✅ `tests/unit/platform/applications/` |
