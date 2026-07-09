# Sprint 1 — Founder's Edition Implementation

**Document:** `SPRINT1_IMPLEMENTATION.md`  
**Sprint:** 1 — Foundation & Founder Readiness  
**Date:** July 5, 2026  
**Repository:** `school-platform` (The JAG OS)

---

## Outcome

| Check | Result |
|-------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` (10 validators + Next.js) | **PASS** |
| Founder Workspace landing (`/dashboard`) | **Implemented** |
| Configurable branding service | **Implemented** |
| Org-config executive role titles | **Implemented** |
| Simplified Founder's navigation | **Implemented** |
| User-visible AcademyOS on P0 surfaces | **Removed** (deferred SaaS surfaces retain legacy strings) |

---

## Architecture: Organization Branding Service

Branding is resolved at runtime from existing `config_sections` — no hard-coded product names in UI components.

### Service location

| File | Role |
|------|------|
| `src/lib/branding/types.ts` | `OrganizationBranding` snapshot type |
| `src/lib/branding/defaults.ts` | Generic fallbacks when config is unset |
| `src/lib/branding/resolve.ts` | Merge branding + organization config |
| `src/lib/branding/load.ts` | Server loader (`loadOrganizationBranding`) |
| `src/lib/branding/templates.ts` | Email, board report, calendar templates |
| `src/lib/branding/index.ts` | Public exports |
| `src/components/branding/BrandingContext.tsx` | Client context for dashboard/apply shells |

### Configuration sources

| Section | Keys added |
|---------|------------|
| `branding` | `product_name`, `product_tagline`, `edition_label`, `monogram`, `email_from_name`, `founder_workspace_label`, `intelligence_engine_label`, `mission_control_label`, `compliance_label`, `financial_intelligence_label`, `connect_label`, `data_hub_label`, `support_mode_label` |
| `organization` | `role_title_CEO`, `role_title_FOUNDER`, `role_title_EXECUTIVE_DIRECTOR`, `role_title_REGIONAL_DIRECTOR`, `role_title_SCHOOL_LEADER` |

### Resolution order

1. **Product name:** `branding.product_name` → `organization.legal_name` → `org_organizations.name` → `"School Platform"`
2. **Role title:** `organization.role_title_*` → `roles.display_name` (DB) → generic fallback map
3. **Surface labels:** `branding.*_label` → generic defaults in `GENERIC_BRANDING_DEFAULTS`

### Admin UI

- `/dashboard/admin/branding` — product identity + surface labels
- `/dashboard/admin/organization` — executive role title overrides

To brand as **The JAG OS Founder's Edition**, configure in Admin → Branding:

```
product_name: The JAG OS
edition_label: Founder's Edition
intelligence_engine_label: Executive Intelligence
```

And in Admin → Organization:

```
role_title_CEO: Founder / CEO
role_title_SCHOOL_LEADER: Superintendent
```

---

## Founder Workspace (`/dashboard`)

- Route unchanged; page renamed functionally to **Founder Workspace**
- Post-login default remains `/dashboard` (`LoginForm` `next` param)
- Hero copy, metrics, and Quick Launch driven by branding service
- CTA links to **Executive Intelligence** using `branding.intelligenceEngineLabel` (Intelligence Engine preserved per amendment)

---

## Navigation Simplification

### Module sidebar (8 modules — unchanged routes)

| Module | Label source |
|--------|--------------|
| `/dashboard` | `branding.founderWorkspaceLabel` |
| Admissions, Students, Scheduling, Finance, Scholarships | Static labels |
| Teacher | `Teacher Studio` |
| HR | `Workforce` |

### Platform footer — Founder's Edition (8 + 2 utilities)

**Visible (labels from branding where noted):**

1. Mission Control  
2. Executive Intelligence (Intelligence Engine)  
3. Compliance  
4. Financial Intelligence  
5. Connect (Integration Hub)  
6. Data Hub  
7. Administration  
8. Global Search  
9. My Preferences *(utility)*  
10. Employee Portal *(utility)*  

**Hidden from sidebar (routes preserved):**

- Work Management (`/work`, `/projects`, `/tasks`, `/playbooks`, `/workload`)
- Workflow Marketplace
- Intelligence Network (standalone)
- Intelligence Platform (AIP)
- Certification Center
- Cloud Console
- Operations Center

### Executive Intelligence sub-nav (8 of 17)

**Visible:** Command Center, Decisions, Briefings, KPIs, Forecasting, Risk, Board Reports, Compliance

**Hidden from nav (routes preserved):** Recommendations, Scenarios, Optimization, Capacity, Network, Strategic Plan, Grants, Benchmarks, Report Studio

### Quick Launch curation

P0 modules only: Admissions, Students, Scheduling, Teacher Studio, Finance, Workforce

---

## Files Changed (by workstream)

### Branding service (new)

- `src/lib/branding/types.ts`
- `src/lib/branding/defaults.ts`
- `src/lib/branding/resolve.ts`
- `src/lib/branding/load.ts`
- `src/lib/branding/templates.ts`
- `src/lib/branding/index.ts`
- `src/components/branding/BrandingContext.tsx`
- `src/lib/dashboard/founders-navigation.ts`

### Configuration

- `src/lib/configuration/types.ts` — extended defaults

### Navigation & shells

- `src/lib/dashboard/navigation.ts`
- `src/components/dashboard/Sidebar.tsx`
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/dashboard/TopNav.tsx`
- `src/components/dashboard/QuickLaunchGrid.tsx`
- `src/components/dashboard/ModulePlaceholder.tsx`
- `src/components/executive/ExecutiveNav.tsx`
- `src/app/dashboard/layout.tsx`

### Founder Workspace & auth

- `src/app/dashboard/page.tsx`
- `src/lib/auth/session.ts` — role labels from org config
- `src/app/login/page.tsx`, `src/app/login/LoginForm.tsx`
- `src/app/layout.tsx` — generic root metadata fallback

### Family & admissions surfaces

- `src/app/portal/layout.tsx`, `src/app/portal/page.tsx`
- `src/components/portal/PortalShell.tsx`
- `src/app/apply/layout.tsx`, `src/app/apply/page.tsx`
- `src/app/apply/portal/page.tsx`, `src/app/apply/thank-you/page.tsx`
- `src/components/admissions/portal/ApplyShell.tsx`
- `src/components/admissions/portal/SubmitApplicationButton.tsx`

### Server-side branding consumers

- `src/lib/admissions/decisions.ts` — decision emails
- `src/lib/executive/reporting.ts` — board report header
- `src/app/api/portal/calendar.ics/route.ts`
- `src/lib/platform/email/sendgrid.ts`
- `src/components/platform/ImpersonationBanner.tsx`

### Admin configuration UI

- `src/app/dashboard/admin/branding/page.tsx`
- `src/app/dashboard/admin/organization/page.tsx`

### Copy cleanup (non-branding)

- `src/app/dashboard/admin/configuration/page.tsx`
- `src/app/dashboard/admin/modules/page.tsx`
- `src/app/dashboard/automation/marketplace/page.tsx`
- `src/app/dashboard/data/page.tsx`
- `src/components/platform/WorkflowMarketplacePanel.tsx`
- `src/lib/platform/execution-engine/catalog/workspace-definitions.ts`

---

## Constraints honored

| Constraint | Status |
|------------|--------|
| No folder renames | ✓ |
| No import path renames | ✓ |
| No database table renames | ✓ |
| No API route renames | ✓ |
| All routes functional | ✓ — hidden routes reachable by direct URL |
| Executive Intelligence preserved | ✓ — Intelligence Engine label configurable |

---

## Branding audit (post-sprint)

**User-visible `AcademyOS` removed from P0 surfaces:** login, dashboard shell, portal, apply, admissions emails, board export, family calendar API.

**Remaining `AcademyOS` in `src/` (~27 occurrences):** deferred enterprise surfaces only:

- `/cloud/*`, `/operations/*` layouts and nav
- `/dashboard/certification/*`
- API documentation routes (`/api/*/docs`)
- Code comments and type file headers
- Certification launch-readiness report generator

These surfaces are explicitly out of Founder's Edition nav scope (build plan §3.1). They can adopt `loadOrganizationBranding()` in Sprint 2+ if exposed to founders.

---

## Verification checklist

- [x] `npm run typecheck` — pass
- [x] `npm run build` — pass (all 10 registry validators green)
- [x] Login → `/dashboard` Founder Workspace
- [x] Sidebar shows trimmed Platform footer
- [x] `/dashboard/executive` reachable with 8-item sub-nav
- [x] Hidden routes (e.g. `/cloud`) still load via direct URL
- [x] Branding configurable via `/dashboard/admin/branding`
- [x] Role titles configurable via `/dashboard/admin/organization`

### Manual smoke (recommended)

1. Configure branding: product name, edition, intelligence engine label
2. Configure role titles: CEO → "Founder / CEO"
3. Log in → verify sidebar, hero, role badge
4. Open Executive Intelligence → verify nav trim
5. Visit `/apply` and `/portal` → verify product name in headers
6. Submit admissions decision email → verify product name in template

---

## Known limitations / deferred

| Item | Sprint |
|------|--------|
| `database.ts` Phase 2 regeneration | Sprint 0.2 / 2 |
| Metric unification (Home vs Mission Control) | Sprint 6 |
| Cloud/Operations/certification branding pass | Sprint 2+ |
| Middleware coarse authorization | Sprint 2+ |
| Founder bootstrap runbook | Sprint 1 follow-up doc |

---

## Related documents

| Document | Purpose |
|----------|---------|
| `FOUNDERS_EDITION_BUILD_PLAN.md` | Scope and sprint roadmap |
| `CURRENT_ARCHITECTURE_REPORT.md` | Architecture source of truth |
| `BRANDING_AUDIT.md` | Pre-sprint AcademyOS inventory |
| `SPRINT0_COMPLETION.md` | Build stabilization baseline |

---

*Sprint 1 delivers the first visible Founder's Edition through configuration-driven branding — not hard-coded product strings.*
