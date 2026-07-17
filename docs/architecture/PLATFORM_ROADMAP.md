# JAG Platform Roadmap

| Field | Value |
|-------|--------|
| **Document** | Platform Roadmap |
| **Type** | Strategic delivery milestones |
| **Status** | Living plan aligned to Constitution & Architecture |
| **Related** | [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) · [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) |

---

## Overview

Delivery is sequenced so that **identity, authorization, and tenancy** harden before intelligence and marketplace scale. Each milestone builds on the previous; later milestones must not weaken earlier security guarantees.

```text
Milestone 1          Milestone 2           Milestone 3
Foundation    →      Platform Services  →  Intelligence Core
                                              │
                                              ▼
                                         Milestone 4
                                         Applications
                                              │
                                              ▼
                                         Milestone 5
                                         Marketplace
```

---

## Milestone 1: Platform Foundation

**Intent:** Establish the non-negotiable substrate for multi-tenant, permission-driven operation.

### Outcomes

| Area | Deliverable |
|------|-------------|
| Organizations | First-class org entities, memberships, isolation helpers |
| Permission engine | Centralized `authorize` / `hasPermission`; no role-string gates |
| Permission catalog | Official keys and legacy aliases |
| Official roles | Platform role set with additive mappings |
| Founder protection | JAG gated by `JAG_ACCESS`; non-founders → AcademyOS |
| Financial security | Finance surfaces require `FINANCE_ACCESS` |
| Platform admin shell | Admin hub sections and permission-gated navigation |
| Constitution | Governing docs under `docs/architecture/` |

### Exit criteria

- Authorization decisions flow through the permission engine.  
- Organization membership is the tenancy source of truth for AcademyOS.  
- JAG and Finance surfaces cannot be reached without catalog permissions.  
- Architecture documentation is published and referenced by engineering standards.

### Status note

Core foundation work (organizations through platform administration gates and constitution docs) is the baseline for subsequent milestones.

---

## Milestone 2: Platform Services

**Intent:** Complete control-plane services for support, emergency access, delegation, and operational administration.

### Outcomes

| Area | Deliverable |
|------|-------------|
| Enterprise support | `PLATFORM_ADMIN` / support roles; org-granted temporary access |
| Break glass | Time-boxed emergency elevation with mandatory audit |
| Delegation | Temporary permission grants with expiry and revocation |
| Security & Compliance Center | Unified views for audit, MFA posture, sessions, incidents |
| Platform Administration Center | Full module set (orgs, users, roles, permissions, subscriptions, audit, support, flags, API keys, security, delegation, break glass, billing) |
| Session overlays | Support / break-glass / delegation context on sessions |
| Expiration jobs | Automated expiry and cleanup of temporary authority |

### Exit criteria

- Temporary authority always has reason, actor, scope, and expiry.  
- Break glass and support access are fully audited and revocable.  
- Platform Administration modules are permission-gated and org-aware where required.  
- No ambient cross-organization access without an explicit, logged grant.

---

## Milestone 3: Intelligence Core

**Intent:** Deliver the Intelligence Layer as a first-class, scoped, permission-gated capability set.

### Outcomes

| Area | Deliverable |
|------|-------------|
| Executive intelligence | KPI, briefing, and risk surfaces under appropriate gates |
| Predictive / forecasting | Enrollment, revenue, capacity models with org scope |
| Network intelligence | Consent-scoped benchmarking (where applicable) |
| Financial intelligence | Scenarios and analytics under `FINANCE_ACCESS` |
| AI platform hardening | Providers, prompt policies, cost controls, human approval gates |
| Graph / causal views | Executive graph over authorized signals |

### Exit criteria

- Intelligence queries never cross tenants without constitutionally allowed, audited paths.  
- AI actions that mutate state require human approval and permission checks.  
- Intelligence surfaces use the same permission catalog as applications.  
- Material exports and overrides are audited.

---

## Milestone 4: Applications

**Intent:** Deepen and standardize product applications on the foundation and services layers.

### Outcomes

| Area | Deliverable |
|------|-------------|
| Admissions | End-to-end intake, review, and decision workflows |
| SIS / academic ops | Student lifecycle, schedules, records |
| Teacher / Parent / Student | Role-appropriate workspaces and portals |
| HR & workforce | Staffing, onboarding, people ops |
| Finance & accounting | Ledger, banking, payroll integrations under financial security |
| Compliance & reporting | Policy, evidence, and board-ready reporting |
| Execution / workspaces | Capability-bound navigation and work composition |

### Exit criteria

- New application features follow Extensibility Rules (catalog + permissions + docs).  
- Applications depend on Platform Services contracts, not ad-hoc auth.  
- Cross-app data access is explicit, scoped, and permission-checked.  
- UX remains product-bounded (JAG vs AcademyOS) per Constitution.

---

## Milestone 5: Marketplace

**Intent:** Commercialize modularity — entitlements, plans, partner-ready packaging.

### Outcomes

| Area | Deliverable |
|------|-------------|
| Modules & entitlements | Installable capability packs per organization |
| Plans & subscriptions | Commercial packaging and billing admin |
| Licensing | Enforceable limits (seats, students, API, storage) |
| Blueprints | Org provisioning templates |
| Integration marketplace | Curated connectors and partner offerings |
| Developer surface | Stable public APIs for Integration Hub |

### Exit criteria

- Enabling a module never bypasses permission checks.  
- Subscriptions and licenses are organization-scoped and auditable.  
- Partner modules conform to Integration Framework and Security Model.  
- Provisioning creates isolated tenants only.

---

## Sequencing Principles

1. **Security before scale** — Marketplace and Intelligence must not precede tenancy and authz maturity.  
2. **Additive catalogs** — New permissions and roles are additive; avoid silent renames without aliases.  
3. **Docs with code** — Milestone exits include updates to Constitution, Architecture, Standards, and Security Model when boundaries change.  
4. **No parallel platforms** — Features land in layers defined in [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md), not as side systems.

---

## Change Control

Roadmap milestone definitions change only when:

- Product strategy shifts (with Founder / executive sponsorship), or  
- Technical discovery proves a dependency reorder is required for security or correctness.

Reorder proposals must state impact on Constitution invariants (identity, authz, audit, tenancy).
