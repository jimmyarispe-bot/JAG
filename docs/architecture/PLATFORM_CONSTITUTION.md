# JAG Platform Constitution

| Field | Value |
|-------|--------|
| **Document** | Platform Constitution |
| **Type** | Governing enterprise architecture |
| **Status** | Canonical |
| **Companions** | [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) · [PLATFORM_ROADMAP.md](./PLATFORM_ROADMAP.md) · [ENGINEERING_STANDARDS.md](./ENGINEERING_STANDARDS.md) · [SECURITY_MODEL.md](./SECURITY_MODEL.md) |
| **Authority** | This constitution governs every future sprint. Where implementation diverges, implementation must be corrected to match this document. |

---

## 1. Vision

The JAG Platform is an enterprise operating system for education organizations.

It enables institutions to run admissions, academics, workforce, finance, compliance, and executive intelligence on a secure multi-tenant foundation — with clear product boundaries, permission discipline, and complete auditability.

Two product faces share one constitutional core:

- **JAG** — Founder-level executive intelligence and platform stewardship.
- **AcademyOS** — Organization-scoped school operations.

---

## 2. Mission

Deliver a platform where:

1. **Leaders** gain decision-quality intelligence without compromising tenant isolation.  
2. **Operators** run daily school workflows under least-privilege access.  
3. **Administrators** govern identity, organizations, and configuration through a single permission model.  
4. **Support and emergency access** are temporary, approved, and fully audited.  
5. **Future products** extend the platform without fracturing authorization, tenancy, or security.

The mission is operational excellence under constitutional constraints — speed inside clear boundaries.

---

## 3. Platform Principles

| # | Principle | Statement |
|---|-----------|-----------|
| P1 | **Permission-only authorization** | All access decisions use the centralized permission engine (`authorize` / `hasPermission`). Roles grant permissions; roles are never checked at call sites. |
| P2 | **Founder Protection** | Only `JAG_ACCESS` may enter JAG. Officially, that grant belongs to Founder. All others land in AcademyOS. Normal support must not require Founder. |
| P3 | **Organization isolation** | Organizations are first-class tenants. Cross-org access requires platform authority or audited temporary authority. |
| P4 | **Least privilege** | Steady-state access matches job function. Elevated access is time-bounded, reason-coded, approved, and auto-expired. |
| P5 | **Audit by default** | Administrative, support, emergency, delegation, and permission-changing actions produce durable audit records. |
| P6 | **Additive evolution** | Official roles and permission catalogs expand additively. Deprecation is explicit and compatibility-preserving. |
| P7 | **Constitution over convenience** | Shortcuts that bypass the engine, tenancy, or audit are defects — even when they appear to work. |

---

## 4. Product Boundaries

### 4.1 JAG

| Attribute | Rule |
|-----------|------|
| Purpose | Executive intelligence, Founder stewardship, platform-level command |
| Gate | `JAG_ACCESS` |
| Audience | Founder (and only identities explicitly granted `JAG_ACCESS` via policy) |
| Non-goals | Day-to-day school ops for staff, teachers, parents, or students |

Denied JAG entry redirects into AcademyOS.

### 4.2 AcademyOS

| Attribute | Rule |
|-----------|------|
| Purpose | School and organization operations |
| Gate | `ACADEMYOS_ACCESS` plus module gates (`FINANCE_ACCESS`, `HR_ACCESS`, `SIS_ACCESS`, etc.) |
| Audience | Executive Director, School Leader, Teachers, Parents, Students, Finance/HR/Admissions staff, Board |
| Tenancy | Organization-scoped |

### 4.3 Boundary rule

Each route or feature has one primary product surface for authorization. Cross-links are allowed. Shared entitlement without a catalog permission is not.

---

## 5. Identity Model

Identity is layered:

| Layer | Responsibility |
|-------|----------------|
| Authenticated subject | Auth provider identity (session) |
| User profile | Durable platform user record |
| Roles | Named bundles that expand into permissions |
| Permissions | Effective authorization set |
| Organization memberships | Tenant affiliation (`owner` / `admin` / `member` / `guest`) |
| School assignments | Operational scope inside an organization |
| Session overlays | Impersonation, support, break glass, delegation |

### Official platform roles (additive)

`FOUNDER` · `EXECUTIVE_DIRECTOR` · `SCHOOL_LEADER` · `ADMINISTRATOR` · `ACCOUNTING` · `HR` · `ADMISSIONS` · `TEACHER` · `PARENT` · `STUDENT` · `BOARD_MEMBER`

Legacy roles may remain. Future support roles (e.g. `PLATFORM_ADMIN`, `SUPPORT_ENGINEER`) are additive and **never** receive automatic customer-organization access.

Display titles are presentation only — never authorization inputs.

---

## 6. Authorization Model

### 6.1 Engine

Privileged decisions must use:

- `authorize(snapshot, permission)`, or  
- `hasPermission(subject, permission)` (and `hasAny` / `hasAll`).

Middleware, layouts, and page guards are adapters to this engine — not alternate policy systems.

### 6.2 Catalog gates (representative)

`JAG_ACCESS` · `ACADEMYOS_ACCESS` · `FINANCE_ACCESS` · `BANKING_ACCESS` · `ACCOUNTING_ACCESS` · `PAYROLL_ACCESS` · `HR_ACCESS` · `ADMISSIONS_ACCESS` · `SIS_ACCESS` · `TEACHER_ACCESS` · `PARENT_ACCESS` · `STUDENT_ACCESS` · `USER_MANAGEMENT_ACCESS` · `SYSTEM_ADMIN_ACCESS` · `AUDIT_ACCESS` · `REPORTING_ACCESS`

Granular keys (e.g. `finance.view`, `impersonate.users`) remain valid inside groups.

### 6.3 Role → permission intent

| Role | Posture |
|------|---------|
| Founder | Every permission, including `JAG_ACCESS` |
| Executive Director | AcademyOS, Finance, HR, Payroll, Admissions, Reporting |
| School Leader | AcademyOS, Admissions, SIS, Reporting |
| Teacher | Teacher Workspace |
| Parent | Parent Portal |
| Student | Student Portal |

### 6.4 Financial security

Accounting, Payroll, Banking, P&L, Cash Flow, Budgets, Forecasting, and Financial Intelligence require `FINANCE_ACCESS`.

### 6.5 Forbidden

- Role-string checks for access (`roles.includes(...)`)  
- Ambient “superuser” bypasses by role name  
- Dual conflicting policy engines  
- Email/user-id allowlists as product authorization  

---

## 7. AI Governance

AI capabilities are platform features bound by the same identity, tenancy, permission, and audit rules as human operators.

| Rule | Requirement |
|------|-------------|
| Context | AI runs under an authenticated, authorized subject |
| Tenancy | Tenant data in prompts/tools/outputs remains organization-scoped |
| High impact | Financial mutation, access changes, bulk export, and emergency workflows require explicit permissions and human-review policy where configured |
| Administration | Providers, prompts, and cost controls are permission-gated |
| Non-bypass | AI must not circumvent Founder Protection, Financial Security, or isolation |
| Attribution | Material AI-assisted admin/executive actions are attributable (actor, org, time, configured provider/model as applicable) |

---

## 8. Audit Requirements

Audit answers: **who** did **what**, to **which organization/resource**, under **which authority**, **when**, and **why**.

### Mandatory classes

- Security events and authentication anomalies  
- Permission and role changes  
- Organization membership and access grants  
- Support sessions  
- Break Glass sessions and in-session actions  
- Delegation lifecycle  
- Platform Administration actions  
- Impersonation start/end  

### Security & Compliance Center (target surface)

1. Audit Log  
2. Break Glass Sessions  
3. Support Sessions  
4. Permission Changes  
5. Security Events  
6. Organization Access History  

Break Glass (and similarly sensitive) logs are **append-only**. Corrections use compensating events, not silent mutation.

---

## 9. Delegation

Delegation is **temporary authority transfer** — not a new permanent role.

Required properties:

- permission (or group) scope  
- organization (and optional school) scope  
- grantor and grantee  
- reason  
- start time  
- expiration time  
- revocation  
- automatic expiration  
- audit of create, use, revoke, and expire  

When a delegation expires, effective permissions revert to the durable role/membership set.

---

## 10. Break Glass

Break Glass is the **emergency access framework** for exceptional circumstances.

| Rule | Requirement |
|------|-------------|
| Never permanent | Emergency access is never a standing org entitlement |
| Required fields | reason, ticket/reference, organization, requested by, approved by, start, expiration |
| Auto-expire | Sessions expire automatically and become invalid immediately |
| Immutable audit | Every action during the session is append-only audited |
| Notify | Organization administrators are notified on begin and end |
| Separation | Distinct from routine support; Founder emergency override is Break Glass, not ambient Founder presence in support |

---

## 11. Extensibility Rules

### Adding a product or module

Declare:

1. Product identity and purpose  
2. Catalog access gate(s)  
3. Tenancy model (platform-global vs organization-scoped)  
4. Role → permission grants  
5. Audit surface  
6. Platform Administration presence (if any)  

### Must not

- Introduce role-name authorization at call sites  
- Pierce organization isolation without temporary authority + audit  
- Grant `JAG_ACCESS` outside Founder Protection policy  
- Silently broaden high-risk gates (e.g. `FINANCE_ACCESS`)  

### Documentation hierarchy

1. **PLATFORM_CONSTITUTION.md** (this document)  
2. Domain architecture (`PLATFORM_ARCHITECTURE.md`, `SECURITY_MODEL.md`, …)  
3. Product specs (`docs/product/`)  
4. Sprint / verification evidence  

Conflicts resolve in favor of this constitution until it is deliberately amended.

### Amendment

Amendments require an explicit architecture decision that states the change, impact, document update, and follow-up implementation work. Silent drift is not an amendment.

---

## Closing

The platform succeeds when operators move quickly **inside** constitutional boundaries: Founder-only JAG, organization-scoped AcademyOS, permission-only authorization, temporary elevated access, and complete audit.

Every future sprint is accountable to this design.
