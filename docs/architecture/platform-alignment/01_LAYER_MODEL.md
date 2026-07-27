# Sprint 057 — Layer model

**Platform · Application · Tenant**

---

## 1. Canonical definitions

### 1.1 Platform = JAG

| Attribute | Rule |
|-----------|------|
| **What** | The enterprise operating system: shared runtime, identity/IAM, organization tenancy, configuration & branding engines, events, workflows, automation / Mission Control engines, CRUD & release gates, integration bus, Cloud Console, shared design systems, intelligence *infrastructure* |
| **Who** | All applications and tenants run *on* JAG |
| **Stewardship surface** | Founder / platform-steward tools gated by `JAG_ACCESS` (`/exec`, platform admin, founder intelligence). This is **not** a separate competing product brand; it is privileged platform capability |
| **Must not** | Encode a single vertical’s SoR (e.g. students, admissions) as “the platform” |

### 1.2 Application = AcademyOS (Application #1)

| Attribute | Rule |
|-----------|------|
| **What** | School / education operations pack: admissions, students, families, teacher, scheduling, scholarships, academic config, education portals (`/portal`, `/apply`), AcademyOS module nav and app home |
| **Gate (compat)** | Existing `ACADEMYOS_ACCESS` + module gates remain valid; they are the Application #1 entitlement pack |
| **Tenancy** | Always organization-scoped |
| **Future apps** | HealthcareOS, NonprofitOS, … declare their own module manifests and permission packs on the same platform |

### 1.3 Tenant = Organization

| Attribute | Rule |
|-----------|------|
| **What** | A customer organization: memberships, schools/campuses, `config_sections`, branding, data isolation (RLS), enabled application(s) |
| **Tenant #1** | **The Academy Way** — runs **AcademyOS** |
| **Must not** | Be confused with “the product name” or with the platform brand |

### 1.4 Naming triple (chrome)

| Name | Meaning | Example (Tenant #1) |
|------|---------|---------------------|
| **Platform name** | JAG | JAG |
| **Application name** | Which app pack is active | AcademyOS |
| **Tenant display name** | Org branding / legal name | The Academy Way Network of Schools (or configured `product_name`) |

UI may show one or more of these; it must not treat any single string as all three.

---

## 2. Relationship diagram

```text
                    +--------------------------+
                    |     JAG  (Platform)      |
                    |  identity · tenancy ·    |
                    |  engines · cloud ops ·   |
                    |  steward surfaces        |
                    +------------+-------------+
                                 |
           +---------------------+---------------------+
           |                     |                     |
           v                     v                     v
    +-------------+       +-------------+       +-------------+
    | AcademyOS   |       | HealthcareOS|       | NonprofitOS |
    | App #1      |       | (future)    |       | (future)    |
    +------+------+       +-------------+       +-------------+
           |
           v
    +-------------------------------------+
    | Tenant (Organization)               |
    | #1 The Academy Way → AcademyOS      |
    | memberships · config · branding ·   |
    | school scope · RLS data             |
    +-------------------------------------+
```

---

## 3. Inventory (current codebase → layer)

### 3.1 Platform (JAG core)

| Area | Paths / signals |
|------|-----------------|
| Identity / IAM | `src/lib/platform/identity/`, `iam/` |
| Configuration engine | `src/lib/configuration/` |
| Branding engine | `src/lib/branding/` (mechanism; not education copy defaults) |
| Events / workflows / automation | `src/lib/platform/events/`, `workflow*`, `automation/` |
| CRUD / release | `src/lib/platform/crud/`, `release/` |
| Integrations bus | `src/lib/platform/integrations/`, Integration Hub routes |
| Cloud Console | `src/app/cloud/`, `src/lib/cloud-platform/` |
| Auth protocol | `src/lib/auth/`, `/login`, `/auth/callback` |
| Intelligence infrastructure | `src/lib/platform/intelligence*`, graphs, execution engine |
| Steward surfaces | `/exec`, `/dashboard/jag`, founder intelligence (gated `JAG_ACCESS`) |
| Design systems | `workspace-design-system`, `experience-system` |

### 3.2 Application #1 (AcademyOS)

| Area | Paths / signals |
|------|-----------------|
| Staff ERP | `/dashboard` module routes (admissions, students, families, teacher, scheduling, scholarships, …) |
| Domain libs | `src/lib/{admissions,students,families,teacher,scheduling,scholarships,…}` |
| Consumer | `/portal`, `/apply` |
| App nav defaults | `DASHBOARD_MODULES`, education labels in `founders-navigation` / `navigation.ts` |
| Education config keys | `academic`, `admissions`, … in `ConfigSectionKey` |
| Education permission pack | `ACADEMYOS_ACCESS`, `SIS_ACCESS`, `ADMISSIONS_ACCESS`, FERPA keys, portal gates |
| Release registry education modules | students, families, admissions, scholarships, scheduling, … |

### 3.3 Tenant

| Area | Signals |
|------|---------|
| Org record | `org_organizations` / organization memberships |
| Branding & org config | `config_sections` (`branding`, `organization`) |
| Scope | schools, campuses, programs; `organization_id` / `school_id` on data |
| **Tenant #1** | The Academy Way (`organization_id` in production Supabase; legal name in org config) |

### 3.4 Confused today (must be reclassified over time)

| Item | Wrong reading | Correct reading |
|------|---------------|-----------------|
| “JAG vs AcademyOS” as peer products | Two brands | Platform vs Application #1 |
| Hardcoded AcademyOS / Education ERP | Platform identity | Application or legacy shell |
| Global Founder's Edition default | Tenant chrome | Platform-steward edition only when `JAG_ACCESS` |
| Founder Morning Brief as module #0 | AcademyOS module | Platform / steward nav region |
| Multiple Vercel projects | Multiple products | One platform deploy; apps are manifests |

---

## 4. Permission posture (compat)

Sprint 057 **does not rename** permission keys.

| Key | Layer meaning after alignment |
|-----|-------------------------------|
| `JAG_ACCESS` | Platform stewardship (Founder Protection) |
| `ACADEMYOS_ACCESS` | Application #1 entitlement |
| Module gates (`FINANCE_ACCESS`, …) | Remain; education-flavored gates belong to AcademyOS pack until a second app needs shared cores |

Denied platform-steward entry continues to land on the AcademyOS home (`/dashboard`) for Tenant #1 — behavior unchanged until a later migration phase explicitly revisits redirects.

---

## 5. Surfaces map (unchanged URLs)

| URL prefix | Layer | Notes |
|------------|-------|-------|
| `/dashboard` | Application #1 (+ some platform modules hosted in-dashboard) | AcademyOS staff ERP |
| `/exec`, `/dashboard/jag`, `/dashboard/founder` | Platform stewardship | `JAG_ACCESS` |
| `/cloud` | Platform ops | Cloud Console |
| `/portal`, `/apply` | Application #1 consumer | |
| `/operations` | Platform / enterprise ops (hybrid; clarify in later phase) | |

URLs are stable through early migration phases.
