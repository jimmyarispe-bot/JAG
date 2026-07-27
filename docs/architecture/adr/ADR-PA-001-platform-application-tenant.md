# ADR-PA-001 — Platform / Application / Tenant

| Field | Value |
|-------|--------|
| **ADR** | PA-001 |
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Sprint** | 057 — JAG Platform Alignment (architecture track) |
| **Amends** | [PLATFORM_CONSTITUTION.md](../PLATFORM_CONSTITUTION.md) §1, §4, closing |

---

## Context

The codebase is a modular monolith that historically described **two peer product faces**: JAG (Founder intelligence) and AcademyOS (school ops). That framing conflicted with the product decision that:

- **JAG** is the **platform**
- **AcademyOS** is **Application #1** on that platform
- **Organizations** are **tenants** (The Academy Way = Tenant #1 on AcademyOS)
- Future applications (HealthcareOS, NonprofitOS, …) share the same platform

Ambiguity caused branding leaks, wrong shell deployments, and unclear module ownership.

## Decision

1. Adopt the three-layer model: **Platform (JAG) · Application · Tenant (Organization)**.  
2. Retain **Founder Protection** (`JAG_ACCESS`) as **platform stewardship**, not as a peer consumer product brand.  
3. Retain **`ACADEMYOS_ACCESS`** and education module gates as Application #1 entitlements (no rename in this sprint).  
4. Publish migration phases in [platform-alignment/02_MIGRATION_PLAN.md](../platform-alignment/02_MIGRATION_PLAN.md); **Sprint 057 does not change runtime behavior**.  
5. Prefer a **single canonical Vercel application** for the monorepo (documented in the migration plan).

## Consequences

| Positive | Trade-off |
|----------|-----------|
| Clear ownership for modules and chrome | Docs must disambiguate “Sprint 057” vs intelligence Ecosystem Sprint 057 |
| Tenant #1 path stays stable | Behavior changes deferred; temporary dual language in older docs |
| Multi-app future without deploy forks | Manifests and branding triple require follow-up sprints |

## Follow-up

- Implement migration phases in order; each phase cites this ADR.  
- Phase 0: [Sprint 058](../platform-alignment/sprint-058/) (deployment).  
- Phase 1: [Sprint 059](../platform-alignment/sprint-059/) (application registry — complete).  
- Update engineering standards cross-links when behavior work starts.  
- Do not remove permission keys or break Tenant #1 AcademyOS access without an explicit later ADR.
