# Sprint 059 — Executive summary

**Application Registry & Enablement** (platform architecture track)

---

## Decision

Teach the JAG platform what an **Application** is, and which applications each **tenant organization** has enabled — without changing any user-visible surface.

| Layer | Identity after Sprint 059 |
|-------|---------------------------|
| **Platform** | JAG (unchanged brand / runtime) |
| **Applications** | Registry row: **AcademyOS** (`academyos`) |
| **Tenant #1** | The Academy Way (`the-academy-way`) |
| **Enabled** | AcademyOS for Tenant #1 and every existing org |

Authority: [ADR-PA-001](../../adr/ADR-PA-001-platform-application-tenant.md) · Phase 1 of [02_MIGRATION_PLAN.md](../02_MIGRATION_PLAN.md).

---

## Outcomes

1. **Catalog** — `platform_applications` holds Application #1 (AcademyOS). Future apps (HealthcareOS, …) are additive rows.  
2. **Enablement** — `organization_applications` joins org ↔ application with `enabled` / `disabled`.  
3. **Compat** — TypeScript soft default: missing enablement ⇒ `["academyos"]`.  
4. **Foundation** — Loaders live under `src/lib/platform/applications/` but are **not** called from layouts, nav, or IAM gates yet.

---

## Non-goals (explicit)

- No dashboard / sidebar / chrome changes  
- No permission key renames or new entitlement checks in request paths  
- No branding triple / application manifest wiring (later phases)  
- No second application stub (Phase 7)

---

## Deliverables

| Artifact | Path |
|----------|------|
| Migration | `supabase/migrations/200_sprint059_application_registry.sql` |
| TS module | `src/lib/platform/applications/` |
| Generated types | `src/types/database.ts` (`platform_applications`, `organization_applications`) |
| Tests | `tests/unit/platform/applications/resolve.test.ts` |
| Docs | this package |

---

## Exit criteria

- [x] Platform understands Applications as first-class metadata  
- [x] Tenant #1 has AcademyOS enabled (explicit seed + soft default)  
- [x] Nothing changes visually for users  
- [x] Phase 1 migration plan updated to point at this package  
