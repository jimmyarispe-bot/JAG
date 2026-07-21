# Branding Audit Report

**Document:** `BRANDING_AUDIT.md`  
**Prepared by:** Lead Engineer (Sprint 0 — Task 4)  
**Date:** July 5, 2026  
**Scope:** All occurrences of **Academy**, **AcademyOS**, and **Academy Intelligence**  
**Action taken:** Audit only — **no renames performed**

---

## Executive Summary

| Term | Total Matches (repo) | User-Visible (`src/`) | Code Comments Only | Documentation |
|------|---------------------|----------------------|-------------------|---------------|
| **AcademyOS** | ~70+ in `src/` | **52** distinct files | ~15 | Extensive in `docs/` |
| **Academy** (standalone / compound) | ~40+ in `src/` | ~25 user-visible | ~15 domain-specific | Hundreds in `docs/` |
| **Academy Intelligence** | **0** | **0** | **0** | **0** |

**Target per Founder's Edition:** 0 user-visible "AcademyOS" strings (per `FOUNDERS_EDITION_BUILD_PLAN.md` §4 Appendix).

**Legitimate "Academy" retention:** Domain terms such as **Academy Way** (instructional philosophy), **Academy FL Campus** (program names), and **formatAcademyTime** (scheduling utility) are instructional/technical identifiers, not product branding.

---

## 1. AcademyOS — User-Visible UI (`src/`)

These strings appear in rendered UI, metadata titles, aria-labels, or exported content visible to end users.

### 1.1 Critical — Primary Product Identity

| File | Line(s) | String / Context |
|------|---------|------------------|
| `src/app/layout.tsx` | 4 | `title: "AcademyOS"` — browser tab / SEO |
| `src/components/dashboard/Sidebar.tsx` | 40, 271 | Sidebar logo: **"AcademyOS"**; footer: **"AcademyOS — Education Operating System"** |
| `src/app/login/LoginForm.tsx` | 45, 90 | **"AcademyOS Sign In"**; aria-label **"Sign in to AcademyOS"** |
| `src/app/dashboard/page.tsx` | 41 | **"Your AcademyOS executive command center"** |
| `src/components/dashboard/QuickLaunchGrid.tsx` | 13 | **"Jump directly into key AcademyOS modules"** |
| `src/components/dashboard/TopNav.tsx` | 86 | aria-label **"Sign out of AcademyOS"** |

### 1.2 High — Portal & Admissions Surfaces

| File | Line(s) | String / Context |
|------|---------|------------------|
| `src/app/portal/page.tsx` | 8, 20 | metadata **"Family Portal \| AcademyOS"**; **"Welcome to AcademyOS"** |
| `src/components/portal/PortalShell.tsx` | 56 | **"AcademyOS Family Portal"** |
| `src/app/apply/page.tsx` | 6 | metadata **"Admissions Inquiry \| AcademyOS"** |
| `src/app/apply/portal/page.tsx` | 11 | metadata **"Application Portal \| AcademyOS"** |
| `src/app/apply/thank-you/page.tsx` | 19 | **"Thank you for your interest in AcademyOS"** |
| `src/components/admissions/portal/ApplyShell.tsx` | 16 | **"AcademyOS Admissions"** |
| `src/components/admissions/portal/SubmitApplicationButton.tsx` | 39 | **"Welcome to AcademyOS!"** |

### 1.3 High — Admissions Email Templates

| File | Line(s) | String / Context |
|------|---------|------------------|
| `src/lib/admissions/decisions.ts` | 34–47 | Email subjects/bodies: **"Welcome to AcademyOS"**, **"AcademyOS Admissions"**, enrollment at **AcademyOS** (8 occurrences) |

### 1.4 High — Enterprise / SaaS Surfaces (Deferred in Founder's Edition)

| File | Line(s) | String / Context |
|------|---------|------------------|
| `src/app/cloud/layout.tsx` | 6–7 | **"AcademyOS Cloud Console"** |
| `src/components/cloud-platform/CloudNav.tsx` | 55 | **"AcademyOS Cloud Console"** |
| `src/app/operations/layout.tsx` | 6–7 | **"AcademyOS Operations Center"** |
| `src/components/operations-platform/OpsNav.tsx` | 37 | **"AcademyOS Operations Center"** |
| `src/app/operations/page.tsx` | 16 | **"AcademyOS Operations Platform"** |
| `src/app/operations/customers/page.tsx` | 13 | **"All AcademyOS customers"** |
| `src/app/operations/university/page.tsx` | 15 | **"AcademyOS University"** |

### 1.5 Medium — Platform Module Labels

| File | Line(s) | String / Context |
|------|---------|------------------|
| `src/components/intelligence-network/AinNav.tsx` | 28 | **"AcademyOS Intelligence Network"** |
| `src/lib/dashboard/navigation.ts` | 185, 283 | **"configure AcademyOS without code"**; **"AcademyOS Cloud Console"** |
| `src/app/dashboard/admin/configuration/page.tsx` | 12 | **"configure AcademyOS without code"** |
| `src/app/dashboard/automation/marketplace/page.tsx` | 13 | **"every AcademyOS module"** |
| `src/app/dashboard/admin/modules/page.tsx` | 11 | **"manage AcademyOS modules"** |
| `src/app/dashboard/data/page.tsx` | 20 | **"every AcademyOS module"** |
| `src/components/platform/WorkflowMarketplacePanel.tsx` | 48 | **"across AcademyOS modules"** |
| `src/app/dashboard/certification/training/page.tsx` | 18 | **"AcademyOS University"** |
| `src/components/certification/CertPanels.tsx` | 160, 163 | **"AcademyOS Version 1.0 Enterprise"** |

### 1.6 Medium — Exported / Generated Content

| File | Line(s) | String / Context |
|------|---------|------------------|
| `src/lib/executive/reporting.ts` | 85 | Board report header: **"# AcademyOS Executive Board Report"** |
| `src/lib/certification/launch-readiness-report.ts` | 49, 63, 114, 134 | Generated markdown reports |
| `src/lib/certification/documentation.ts` | 18, 22, 23 | Auto-generated launch docs |
| `src/app/api/portal/calendar.ics/route.ts` | 19 | ICS calendar name: **"AcademyOS Family Calendar"** |
| `src/lib/portal/calendar.ts` | 158 | ICS PRODID: **"AcademyOS"** |
| `src/lib/compliance/calendar.ts` | 30, 33 | ICS PRODID/CALNAME: **"AcademyOS"** |

### 1.7 Low — API Documentation Names (Internal)

| File | String |
|------|--------|
| `src/app/api/intelligence/docs/route.ts` | **"AcademyOS Intelligence Platform API"** |
| `src/app/api/intelligence/context/route.ts` | **"AcademyOS Enterprise Intelligence & AI Readiness Framework"** |
| `src/app/api/integrations/docs/route.ts` | **"AcademyOS Enterprise Integration Hub API"** |
| `src/app/api/data/docs/route.ts` | **"AcademyOS Enterprise Data Platform API"** |
| `src/app/api/cloud/docs/route.ts` | **"AcademyOS Cloud Platform API"** |
| `src/app/api/certification/reports/route.ts` | **"AcademyOS Enterprise Certification Center API"** |

### 1.8 Low — Email Default Sender

| File | Line(s) | String |
|------|---------|--------|
| `src/lib/platform/email/providers/resend.ts` | — | `RESEND_FROM_NAME ?? "AcademyOS"` |

---

## 2. AcademyOS — Code Comments & Types (Non-User-Visible)

| File | Context |
|------|---------|
| `src/types/database.ts` | Header comment |
| `src/lib/platform/services/index.ts` | Header comment |
| `src/lib/platform/automation/types.ts` | Header comment |
| `src/lib/platform/identity/types.ts` | Header comment |
| `src/lib/cloud-platform/page-guard.ts` | Guard comment |
| `src/lib/platform/identity/sso.ts` | Future SSO mapping comment |
| `src/lib/integration-hub/types.ts` | SDK package name `AcademyOS.Sdk` |
| `src/lib/operations-platform/customer-success.ts` | **"AcademyOS University courses"** (action text — may surface in UI) |

---

## 3. Academy — User-Visible Occurrences

### 3.1 Program / School Names (Likely Keep)

| File | String |
|------|--------|
| `src/lib/constants/programs.ts` | **"Academy FL Campus"**, **"Academy FL Virtual"**, **"Academy GA Campus"**, **"Academy GA Hybrid"**, **"Academy High School"**, **"Academy Virtual"** |
| `src/lib/admissions/communications/merge-fields.ts` | Default `school_name: "The Academy"` |
| `src/lib/admissions/communications/actions.ts` | `schoolName: "The Academy Way"` |
| `src/components/platform/admin/OrganizationHierarchyPanel.tsx` | `"The Academy Way"` org name fallback |

### 3.2 Instructional Domain (Likely Keep — Not Product Brand)

| File | String |
|------|--------|
| `src/lib/scheduling/academy-way.ts` | **Academy Way** scheduling rules module |
| `src/app/dashboard/scheduling/SchedulingPageContent.tsx` | subtitle mentions **"Academy Way rules"** |
| `src/components/scheduling/SchedulingTabs.tsx` | **"Academy Way rules"** heading |
| `src/lib/teacher/progress.ts` | Comment: Structured Literacy (Academy Way) |
| `src/lib/scheduling/conflicts.ts` | **"Academy Way rule violation"** alert title |

### 3.3 Cloud Platform Tier Label

| File | String |
|------|--------|
| `src/lib/cloud-platform/types.ts` | `{ key: "standard", label: "Standard Academy" }` |

### 3.4 Demo / Placeholder

| File | String |
|------|--------|
| `src/app/dashboard/certification/demo/page.tsx` | Placeholder **"Demo Academy"** |

---

## 4. Academy Intelligence

**Result: Zero occurrences** across the entire repository.

Related branding uses different terms:
- **"AcademyOS Intelligence Network"** (`AinNav.tsx`)
- **"AcademyOS Intelligence Platform API"** (`api/intelligence/docs`)
- **"AcademyOS Enterprise Intelligence & AI Readiness Framework"** (`api/intelligence/context`)

---

## 5. Public Assets & Config

| File | Content |
|------|---------|
| `public/cloud-manifest.json` | `"name": "AcademyOS Cloud Console"` |
| `public/operations-manifest.json` | `"name": "AcademyOS Operations Center"` |
| `supabase/.temp/linked-project.json` | Supabase project name: **"AcademyOS"** |
| `package.json` | `"name": "school-platform"` (no AcademyOS — repo name only) |

---

## 6. Documentation Corpus (Not User-Visible in App)

Extensive **AcademyOS** and **Academy Way** references exist in:

- `docs/blueprints/academy-way-learning-system/` — 50+ blueprint files
- `docs/constitution/` — Constitutional amendment indexes
- `docs/governance/jag-enterprise/` — Enterprise operating model
- `docs/governance/jag-knowledge-system/` — Knowledge system docs
- `docs/architecture/CURRENT_ARCHITECTURE_REPORT.md` — References AcademyOS as legacy name
- `docs/architecture/FOUNDERS_EDITION_BUILD_PLAN.md` — Rename plan (not yet executed)

These are governance/blueprint documents and are out of scope for Founder's Edition UI branding pass unless explicitly included.

---

## 7. Rename Priority Matrix (For Sprint 1 — Not Executed)

| Priority | Target | Files | Suggested Replacement |
|----------|--------|-------|----------------------|
| P0 | App title & login | `layout.tsx`, `LoginForm.tsx`, `Sidebar.tsx` | **The JAG OS** |
| P0 | Portal & apply surfaces | `portal/page.tsx`, `PortalShell.tsx`, `apply/*` | **The JAG OS** / **JAG Family Portal** |
| P1 | Dashboard copy | `page.tsx`, `QuickLaunchGrid.tsx`, `TopNav.tsx` | **JAG Home**, **JAG OS** |
| P1 | Admissions emails | `admissions/decisions.ts` | **The JAG OS Admissions** |
| P2 | Enterprise surfaces | `cloud/*`, `operations/*` | Hide from nav; rename when re-exposed |
| P3 | API doc names | `api/*/docs/route.ts` | **JAG OS** API names |
| Keep | Academy Way | `scheduling/academy-way.ts`, instructional copy | No change — instructional philosophy |
| Keep | Program names | `constants/programs.ts` | School-specific labels |

---

## 8. Acceptance Criteria Check

| Criterion (Founder's Edition) | Current State |
|-------------------------------|---------------|
| User-visible "AcademyOS" strings = 0 | **FAIL** — 52+ files in `src/` |
| "Academy Intelligence" retired | **PASS** — term not used |
| Product title = "The JAG OS" | **FAIL** — `layout.tsx` still "AcademyOS" |

---

*No application code or strings were modified during this audit.*
