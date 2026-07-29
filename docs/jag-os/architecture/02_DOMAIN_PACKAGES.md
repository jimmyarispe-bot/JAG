# 02 — Domain Packages

**Phase Ω-0** · Classification: **DOMAIN PACKAGE**  
**Authority:** [00_CANONICAL_ARCHITECTURE.md](./00_CANONICAL_ARCHITECTURE.md) · Constitution Law 4

Industry-specific intelligence packages. They plug into JAG. They are **not products**.

Constitutional pattern: Core=NO (as product) · Outside education=NO for Education pack · Domain-specific=YES · Presentation-only=NO · Violate=if they reimplement Core or claim product status.

---

## A. Education Intelligence (AcademyOS) — first domain

### A.1 Industry pack engines (`packages/academyos/`)

| Module | Location | Purpose | Dependencies | Consumers | Classification | Reasoning | Violations | Future state |
|--------|----------|---------|--------------|-----------|----------------|-----------|------------|--------------|
| Pack root | `packages/academyos` | Education industry pack install + factories | JAG Core | App runtime, APIs | **DOMAIN** | Education SoR pack | Named as product historically | Brand as Education Intelligence |
| Admissions | `admissions/` | Pipeline, enrollment, parent apply | Identity, Workflow, Knowledge, Finance | Dashboard admissions, apply | **DOMAIN** | Pedagogy/ops SoR | Local automation/comms engines in `src/lib/admissions` | Consume Workflow/Comms Core |
| SIS | `sis/` | Student lifecycle, attendance, family | Identity, Org, Knowledge | Students, portal | **DOMAIN** | Education student SoR | — | Keep in pack |
| Academic ops | `academic-ops/` | Classes, sessions, calendars | Scheduling Core, Org | Teacher, scheduling | **DOMAIN** | School ops | — | Keep |
| Learning | `learning/` | Curriculum, mastery, assessments, interventions | — (SoR) | LI facade, teacher, portal | **DOMAIN** | Pedagogy SoR | Must not be rebuilt in Core | Canonical learning SoR |
| Finance (edu) | `finance/` | Tuition, family billing adapters | FinanceEngine | Portal billing, finance UX | **DOMAIN** | Adapter layer | Risk of parallel ledger | Adapter only → FinanceEngine |
| Workforce | `workforce/` | Employees, timesheets, payroll prep | Identity, Knowledge | Teacher timesheets, HR | **DOMAIN** | Edu workforce | Overlap `src/lib/hr` | Pack owns edu specialization |
| Communications (edu) | `communications/` | Templates, announcements content | Future Notification Core | Portal, teacher | **DOMAIN** | Content pack | Parallel `src/lib/communications` | Templates in domain; transport Core |
| Twin mappings | `twin/` | Academy → Twin projections | Digital Twin Core | Experience events | **DOMAIN** | Industry adapter | — | Keep as adapter |
| Connectors | `connectors/` | Education connector catalog | Connector framework | Integrations | **DOMAIN** | Industry catalog | — | Keep |
| Domain/factory | `domain/` | Shared wiring | — | Pack internals | **DOMAIN** | — | — | Keep |
| Thin service facades | `attendance`, `billing`, `classrooms`, `enrollment`, `grading`, `guardians`, `iep`, `reporting`, `scheduling`, `scholarships`, `schools`, `staff`, `students`, `transcripts` | Re-export domain services | Pack modules | APIs | **DOMAIN** | Convenience | — | Keep thin |
| Intelligence (edu dash) | `intelligence/` | Education executive dashboard builders | Core + pack | Exec context | Mix **DOMAIN** / composition | Edu-flavored metrics | — | Data from pack; UI via Orchestrator |
| Operations / validation / hardening | `operations`, `validation`, `hardening` | RC gates for Education pack | Core readiness | Release | **DOMAIN** *(pack QA)* or Core tooling | Release gates | — | Prefer Core readiness + pack suites |

### A.2 Learning Intelligence facade (`packages/platform/learning-intelligence`)

| Item | Detail |
|------|--------|
| Location | `packages/platform/learning-intelligence` |
| Purpose | Shared facade over AcademyOS learning SoR (P-015) |
| Classification | **DOMAIN PACKAGE** *(hosted under packages/platform for import ergonomics)* |
| Reasoning | Education-bound SoR; not universal mastery |
| Constitutional Q2 (outside education)? | **NO** for SoR — facade may stay callable from Core UX but data is Education |
| Future state | Remain facade; never become second mastery engine |

### A.3 Application runtime (`src/applications/academyos/`)

| Area | Purpose | Classification | Future state |
|------|---------|----------------|--------------|
| manifest, bootstrap, runtime, composition, infrastructure | DI, registration, Supabase repos | **DOMAIN** | Keep as Education pack runtime |
| domain/*, application/* | Education rules & use cases | **DOMAIN** | Keep |
| schemas, forms, workflows, api, permissions, navigation, seed | Framework contributions | **DOMAIN** | Register into JAG |
| dashboards, reports, intelligence, workspace, ui | Hosted Academy UX | **LEGACY EXPERIENCE SURFACE** | Absorb into Orchestrator contexts |
| platform-adapters | Bridges to Core | **DOMAIN** | Keep |

### A.4 Declarative Education package (`src/packages/academy/`)

| Item | Classification | Notes |
|------|----------------|-------|
| `ACADEMY_PACKAGE`, composition, capability packs | **DOMAIN** | Third packaging surface — consolidate ownership with applications + packages/academyos (violation: triple packaging) |

### A.5 Education domain libs (`src/lib/`)

| Module | Location | Purpose | Classification | Violations | Future state |
|--------|----------|---------|----------------|------------|--------------|
| Admissions | `src/lib/admissions` | CRM, cases, automation, experience | **DOMAIN** + legacy experience | Local engines | Engines → Core Workflow/Comms; UX → L4→L3 |
| Students | `src/lib/students` | Student lifecycle | **DOMAIN** | — | Pack-aligned |
| SIS / SSIS | `src/lib/sis`, `ssis` | Activation, success score | **DOMAIN** | — | Pack-aligned |
| Scheduling | `src/lib/scheduling` | Placement, conflicts, attendance bridge | **DOMAIN** | “Academy Way” naming | Consume scheduling.core |
| Scholarships / Funding | `src/lib/scholarships`, `scholarship`, `funding` | Aid workflows | **DOMAIN** | — | Finance adapters |
| Instruction | `src/lib/instruction` | Instructional growth / forms | **DOMAIN** | — | Learning pack |
| Families | `src/lib/families` | Family invites/household | **DOMAIN** | — | SIS pack |
| HR (school) | `src/lib/hr` | School HR portal analytics | **DOMAIN** | Overlap hr-platform | Edu specialization |
| Finance (legacy helpers) | `src/lib/finance` | Tuition engine, family center | **DOMAIN** *(adapter)* + Core bleed | Duplicate ledger risk | Adapter only |
| Certification / Compliance / Calendar | `certification`, `compliance`, `calendar` | School compliance & calendar UX | **DOMAIN** / Core calendar | — | Split primitives vs edu rules |
| EDI | `src/lib/edi` | Education data interchange | **DOMAIN** | — | Keep |
| PAJ / ULR / jag-profile *(in platform)* | `src/lib/platform/paj`, `ulr`, `jag-profile` | Learning journey / registry / learner profile | **DOMAIN** *(mis-homed in platform)* | Education in Core tree | Move to Education pack |
| parent-communication *(platform)* | `src/lib/platform/parent-communication` | Parent deliver helpers | **DOMAIN** *(mis-homed)* | — | Education pack |
| SchoolContext / AcademyOS Platform Services | `src/lib/platform/shared`, `services` | Edu-named glue | **DOMAIN** *(mis-homed)* | — | Education pack |

### A.6 Education APIs

`/api/academyos/**`, `/api/admissions/**`, `/api/learning/**`, `/api/ssis/**`, `/api/scholarship/**`, `/api/portal/**` (education-scoped) — **DOMAIN** surface area consuming Core where possible.

---

## B. Future industry packages (placeholders)

No production SoR assumed. Declarative reference packages may already exist under `src/packages/`.

| Industry | Placeholder location | Status | Classification |
|----------|---------------------|--------|----------------|
| Healthcare | `src/packages/healthcare` | Reference org / blueprint | **DOMAIN** (stub) |
| Manufacturing | `src/packages/manufacturing` | Reference org / blueprint | **DOMAIN** (stub) |
| Government | `src/packages/government` | Reference org / blueprint | **DOMAIN** (stub) |
| Construction | — | Not started | **DOMAIN** (future) |
| Legal | — | Not started | **DOMAIN** (future) |
| Hospitality | — | Not started | **DOMAIN** (future) |
| Retail | — | Not started | **DOMAIN** (future) |
| Insurance | — | Not started | **DOMAIN** (future) |
| Energy | — | Not started | **DOMAIN** (future) |
| Nonprofit | — | Not started | **DOMAIN** (future) |

**Rule:** New industries configure UOM + add a domain package. **Never fork JAG.**

---

## C. Constitutional review (Education domain)

| # | Question | Answer |
|---|----------|--------|
| 1 | Belong in JAG Core? | **NO** (as SoR / product) |
| 2 | Benefit orgs outside education? | **NO** for pedagogy/SIS SoR; adapters may call Core |
| 3 | Domain-specific? | **YES** |
| 4 | Presentation only? | **NO** (owns education SoR) |
| 5 | Violate Constitution? | **YES** where packaged as parallel product, portals-as-products, or Core reimplementation — see [05](./05_CONSTITUTIONAL_VIOLATIONS.md) |
| 6 | Duplicate another capability? | **YES** — admissions engines, finance helpers, communications vs Core |

---

## D. Triple packaging debt (Education)

| Surface | Path |
|---------|------|
| Industry pack stores/services | `packages/academyos` |
| Declarative package | `src/packages/academy` |
| Application runtime / DI | `src/applications/academyos` |

**Recommended future state (not Ω-0):** One Education Intelligence package with clear sublayers (SoR · adapters · registrations · context widgets). Document only — do not move code in Ω-0.
