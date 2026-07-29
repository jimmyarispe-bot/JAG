# 10 — Canonical Product Specification

# JAG Organizational Intelligence Operating System  
## with AcademyOS as Education Intelligence Domain

**This document is the master product specification.**  
Fragmented roadmaps and inventories defer here for *product shape*. Sequencing defers to `docs/platform/domain-integration/06_MASTER_ROADMAP.md`.

---

## 1. One platform

```
                    JAG OIOS
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   Shared Engines   Executive     Industry
   (canonical SoR   Intelligence  Intelligence
    & reasoning)        │              │
                        │              ├── Education = AcademyOS
                        │              ├── Healthcare (future)
                        │              └── Nonprofit / others (future)
                        │
                   Mr. JAG · Evolution · Innovation · CFO · Founder surfaces
```

**AcademyOS is not a parallel operating system.**  
It is the **Education Intelligence Domain** installed on JAG.

---

## 2. Shared engines (canonical owners)

| Concern | Canonical owner |
|---------|-----------------|
| Identity & access | Identity Engine |
| Organization / governance / strategy | OrganizationEngine |
| General ledger & financial SoR | FinanceEngine |
| Banking / cash | TreasuryEngine |
| Reconciliation | ReconciliationEngine |
| Operational revenue & payables | RevenueEngine · PayablesEngine |
| Financial statements & planning | FinancialReportingEngine · FinancialPlanningEngine |
| Financial reasoning | ChiefFinancialOfficerEngine |
| Documents · evidence · knowledge graph · search · OCR | KnowledgeEngine |
| Workflows | Workflow Framework |
| Forms | Forms Framework |
| Help / coaching | Mr. JAG™ |
| Change proposals | Evolution™ |
| Opportunity portfolio | Innovation™ |
| Twin / evidence / memory projections | Digital Twin · Evidence Ledger · Organizational Memory |

Industry domains **consume** these engines. They do not reimplement them.

---

## 3. Education Intelligence (AcademyOS)

### 3.1 Owns

- Admissions CRM & application journeys  
- SIS: students, families, schools, classes  
- Scheduling, attendance, teacher daily ops  
- Parent & student portals (education UX)  
- Gradebook rules, transcripts, school calendars  
- IEP / 504 / therapy / behavior SoR  
- Scholarships & family-billing **adapters**  
- Education workforce specializations (substitutes, certifications)  
- School communication **templates** & content  

### 3.2 Must consume (never fork)

| Need | Consume |
|------|---------|
| Auth / roles | Identity |
| Campuses as org units | OrganizationEngine |
| Tuition GL, AP/AR, treasury | Finance* engines |
| Financial advice | CFO (recommend only) |
| Documents / evidence | KnowledgeEngine |
| Pipelines | Workflow Framework |
| Pedagogy intelligence runtime | Learning Intelligence (**P-015**) |

### 3.3 Surfaces

| Layer | Path |
|-------|------|
| Industry pack | `packages/academyos/` |
| App composition | `src/applications/academyos/` |
| Legacy product services | `src/lib/{students,families,admissions,…}` (migrate carefully) |
| UI | `/dashboard/**`, `/portal/**`, `/apply/**`, `/academyos/**` |
| API | `/api/academyos/**` (+ shared `/api/finance/**`, `/api/cfo/**`, `/api/knowledge/**`) |

---

## 4. Product experiences (canonical)

| Experience | Purpose |
|------------|---------|
| Public marketing | Brand & lead gen |
| Apply | Prospect → applicant |
| Parent portal | Family engagement, finance, docs, progress |
| Student portal | Schedule, goals, progress, portfolio |
| Teacher workspace | Instruction, attendance, mastery, comms |
| School leader | Enrollment, staff, compliance, school finance |
| Admissions / registrar | Pipeline & SIS registration |
| Finance | Shared finance ops + edu adapters |
| HR / workforce | Hiring, payroll, certifications |
| Executive / board / founder | Org + CFO + innovation |
| Platform admin | Tenancy, modules, integrations |

Detailed screens: [02_FRONTEND_SCREEN_CATALOG](./02_FRONTEND_SCREEN_CATALOG.md)  
Roles: [06_ROLE_EXPERIENCE_MAP](./06_ROLE_EXPERIENCE_MAP.md)

---

## 5. Evidence & AI rules

1. Every AI conclusion cites evidence (Knowledge / Finance lineage / CFO metrics).  
2. AI **recommends**; it does not silently mutate Finance or SIS SoR.  
3. Summaries require citations.  
4. Diagnoses appear only if explicitly documented (Knowledge extraction rule).  
5. Education pedagogy interpretation lands in **P-015**, not in Knowledge core.

---

## 6. Documentation hierarchy

| Level | Document |
|-------|----------|
| **Product spec (this)** | `docs/platform/consolidation/10_CANONICAL_PRODUCT_SPEC.md` |
| Consolidation pack | `docs/platform/consolidation/00–09` |
| Domain integration (P-010A) | `docs/platform/domain-integration/*` |
| Master roadmap | `docs/platform/domain-integration/06_MASTER_ROADMAP.md` |
| Engine docs | `docs/platform/{finance,cfo,knowledge,…}` |
| Education domain docs | `docs/academyos/*`, `docs/applications/academyos/*` |
| Pedagogy IP | `docs/blueprints/academy-way-learning-system/`, governance catalogs |

Older roadmaps remain historical and **defer** to the master roadmap + this spec.

---

## 7. Definition of done for “consolidated”

A capability is consolidated when:

1. It appears in the master capability list.  
2. Its screen/workflow/form/portal/role mapping exists.  
3. Its **engine owner** is unambiguous.  
4. Duplicates are marked Deprecated/Duplicate with a retirement path.  
5. New work extends the Education Domain or Shared Engines — never a third stack.

---

## 8. Immediate next build

**P-015 — Learning Intelligence™**  
Integrate existing AcademyOS mastery, assessment, intervention, and literacy IP into a shared Learning Intelligence engine consumed by Education UX — **do not rediscover or rebuild**.

---

*End of canonical product specification.*
