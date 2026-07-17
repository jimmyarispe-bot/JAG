# JAG Platform Architecture

| Field | Value |
|-------|--------|
| **Document** | Platform Architecture |
| **Type** | Enterprise reference architecture |
| **Status** | Canonical companion to the Platform Constitution |
| **Parent** | [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) |

---

## 1. Purpose

This document describes the layered structure of the JAG Platform: how services, intelligence, applications, marketplace capabilities, and integrations compose — without replacing the constitutional rules for identity, authorization, and tenancy.

---

## 2. Layered Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Experience Layer                                           │
│  JAG · AcademyOS · Portals · Cloud · Operations · Admin     │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                          │
│  Admissions · SIS · Teacher · HR · Finance · Compliance …   │
├─────────────────────────────────────────────────────────────┤
│  Intelligence Layer                                         │
│  Executive · Predictive · Network · Financial · AI Platform │
├─────────────────────────────────────────────────────────────┤
│  Platform Services Layer                                    │
│  Identity · Authz · Orgs · Audit · Config · Events · Work   │
├─────────────────────────────────────────────────────────────┤
│  Integration & Marketplace Layer                            │
│  Connectors · Webhooks · APIs · Modules · Entitlements      │
├─────────────────────────────────────────────────────────────┤
│  Data & Infrastructure                                      │
│  Supabase (Postgres, Auth, RLS) · Object storage · Jobs     │
└─────────────────────────────────────────────────────────────┘
```

### Layer rules

| Layer | May depend on | Must not |
|-------|---------------|----------|
| Experience | Applications, Platform Services | Bypass authorization |
| Applications | Platform Services, Integration public APIs | Call other apps’ private internals casually; skip tenancy |
| Intelligence | Platform Services, scoped application data | Cross-tenant reads; unscoped model calls |
| Platform Services | Data & Infrastructure | Encode product UI concerns |
| Integration / Marketplace | Platform Services contracts | Store ambient cross-org secrets |

Authorization and tenancy are enforced at Platform Services and at experience edges (middleware / layouts). UI is never the sole security boundary.

---

## 3. Platform Services

Core service domains (logical; packaged under `src/lib/platform/` and related libraries):

| Service | Responsibility |
|---------|----------------|
| **Identity & Session** | Users, auth bridge, impersonation overlays, preferences |
| **Authorization** | Permission engine, catalogs, role mappings, route/page guards |
| **Organizations** | Tenant entities, memberships, branding, isolation helpers |
| **Hierarchy** | Schools, campuses, programs, departments, assignments |
| **Audit & Security** | Security events, compliance views, immutable emergency logs |
| **Configuration** | Organization/school configuration studio |
| **Work & Automation** | Queues, workflows, mission-control composition |
| **Execution Engine** | Capability-bound workspaces and navigation filtering |
| **Cloud / Commercial** | Customers, subscriptions, provisioning, licensing |
| **AI Platform** | Providers, prompts, policies, cost controls |

### Cross-cutting contracts

- Every privileged service method accepts or resolves an authorization subject.  
- Tenant-owned resources require `organization_id` (or equivalent) and membership/scope checks.  
- Temporary authority (support, break glass, delegation) is modeled as session overlays with expiration.

---

## 4. Intelligence Layer

Intelligence is a first-class layer, not a single module. It consumes scoped operational data and produces insights, forecasts, rankings, and decision support.

### 4.1 Capabilities (representative)

| Capability | Intent |
|------------|--------|
| Executive Intelligence | KPIs, briefings, risk, board-ready views |
| Executive Graph | Relationship and causality reasoning over org signals |
| Predictive / Forecasting | Enrollment, revenue, staffing, capacity projections |
| Network Intelligence | Peer/anonymized benchmarking (consent-scoped) |
| Financial Intelligence | P&L, cash, scenarios, under `FINANCE_ACCESS` |
| AI-assisted analysis | Prompted insights under AI Governance |

### 4.2 Intelligence rules

1. **Scoped by default** — queries carry organization (and school when required).  
2. **Permission-gated** — catalog/granular permissions gate surfaces and exports.  
3. **Human gates for high impact** — AI recommends; authorized humans approve mutations.  
4. **No second RBAC** — intelligence must not invent parallel role checks.  
5. **Audit material actions** — exports, overrides, and emergency-linked insights are logged.

---

## 5. Applications

Applications are product modules that deliver operator value on AcademyOS (and select JAG surfaces).

| Application | Primary gate(s) | Tenancy |
|-------------|-----------------|---------|
| Admissions | `ADMISSIONS_ACCESS` | Organization / school |
| SIS / Students | `SIS_ACCESS` | Organization / school |
| Teacher Workspace | `TEACHER_ACCESS` | Organization / school |
| Parent Portal | `PARENT_ACCESS` | Family / student linkage |
| Student Portal | `STUDENT_ACCESS` | Student linkage |
| HR / Workforce | `HR_ACCESS` | Organization / school |
| Finance & FI | `FINANCE_ACCESS` (+ banking/accounting/payroll as applicable) | Organization |
| Compliance | compliance.* / reporting | Organization / school |
| Platform Administration | `SYSTEM_ADMIN_ACCESS`, `USER_MANAGEMENT_ACCESS`, etc. | Platform + org admin scopes |
| JAG Executive | `JAG_ACCESS` | Founder / platform stewardship |

### Application packaging

- Routes live under experience prefixes (`/dashboard`, `/exec`, `/portal`, `/cloud`, …).  
- Domain logic lives in libraries; routes remain thin.  
- New applications follow Constitution §11 Extensibility Rules.

---

## 6. Marketplace

The Marketplace is the commercial and modular extension plane for the platform.

### 6.1 Concepts

| Concept | Description |
|---------|-------------|
| **Modules** | Installable capability packs (feature flags / entitlements) |
| **Plans & Subscriptions** | Commercial packaging tied to organizations |
| **Licenses** | Enforced limits (students, staff, API, storage) |
| **Blueprints** | Provisioning templates for new organizations |
| **Partner offerings** | Future third-party modules under platform contracts |

### 6.2 Marketplace rules

- Entitlements are organization-scoped.  
- Enabling a module does not bypass permission catalogs — it unlocks surfaces that remain permission-checked.  
- Provisioning creates isolated organizations; it never shares tenant data.  
- Billing & Subscriptions appear in Platform Administration under `SYSTEM_ADMIN_ACCESS` (or successor commercial admin gates).

---

## 7. Integration Framework

### 7.1 Purpose

Connect external systems (ERP, payments, productivity, banking, CRM) without collapsing tenant boundaries.

### 7.2 Architecture

```text
Application / Intelligence
        │
        ▼
 Org Integration Bridge  ──►  Integration Hub (public APIs)
        │                         │
        │                         ├── Connector instances (per org)
        │                         ├── Secrets (org-scoped)
        │                         ├── Webhooks / events
        │                         └── Developer credentials
        ▼
   External Systems
```

### 7.3 Rules

| Rule | Statement |
|------|-----------|
| Org ownership | Connector instances and secrets belong to an organization |
| Public contracts | Apps use Integration Hub public APIs — not private internals |
| Permission gates | Manage/view connectors require integration.* (or catalog successors) |
| Audit | Credential rotation, webhook delivery failures, and admin changes are auditable |
| Isolation | Org A credentials must never be readable in Org B context |

---

## 8. Experience Mapping

| Surface | Prefix (typical) | Product |
|---------|------------------|---------|
| JAG / Executive Command | `/exec`, `/dashboard/jag` | JAG |
| AcademyOS Dashboard | `/dashboard/*` | AcademyOS |
| Parent/Student Portal | `/portal` | AcademyOS portals |
| Public Apply | `/apply` | Admissions intake |
| Cloud Console | `/cloud` | Platform commercial/ops |
| Operations Center | `/operations` | Platform operations |
| Platform Administration | `/dashboard/admin` | Control plane |

Founder Protection applies to all JAG prefixes. Financial Security applies to finance surfaces regardless of navigation entry point.

---

## 9. Data & Infrastructure Notes

- **Primary datastore:** Supabase PostgreSQL with Row Level Security as defense in depth.  
- **Auth:** Supabase Auth; application authorization is permission-engine based.  
- **Types:** Generated/maintained database types mirror schema.  
- **Jobs:** Cron/API workers enforce expiration of temporary authority and maintenance tasks.  
- **RLS ≠ product policy:** RLS protects rows; product policy still requires `authorize` / `hasPermission` at the application edge.

---

## 10. Evolution

Structural changes to layers, services, or integration contracts require:

1. Alignment with [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md)  
2. Updates to this document  
3. Security review when tenancy, authz, or audit boundaries change  
4. Roadmap milestone adjustment in [PLATFORM_ROADMAP.md](./PLATFORM_ROADMAP.md)
