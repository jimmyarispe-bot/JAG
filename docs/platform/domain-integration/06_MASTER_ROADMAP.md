# 06 — Master Roadmap (Canonical)

**This document is the single roadmap for Shared Platform, Executive Intelligence, Industry Intelligence, and AcademyOS.**

Older roadmaps remain historical references and should defer here:

- `docs/architecture/PLATFORM_ROADMAP.md` → see banner pointing here  
- `docs/architecture/JAG_IMPLEMENTATION_ROADMAP.md`  
- `docs/jag-os/JAG_OS_ROADMAP.md`  
- Finance sprint notes embedded in P-008–P-010 docs  

---

## A. Shared Platform

| Sprint | Domain | Primary deliverable | Status |
|--------|--------|---------------------|--------|
| ✅ P-001–004 | Mr. JAG™ | Help, Academy, Coach foundation | Complete |
| ✅ P-005 | Evolution™ | Capture → classify → proposal engine | Complete |
| ✅ P-006 | Innovation™ | Opportunity portfolio & horizons | Complete |
| ✅ P-007 | Organization™ | Universal org model, constitution, performance | Complete |
| ✅ P-008 | Finance Foundation | Canonical model, GL, AP/AR foundations | Complete |
| ✅ P-009 | Treasury & Banking | Banking, treasury, imports, cash | Complete |
| ✅ P-010 | Reconciliation™ | Auto/manual match, approvals, month-end close | Complete |
| ✅ **P-010A** | **Domain Integration™** | Inventory, crosswalk, engines, map, gaps, IP catalog | **Complete** |
| ✅ **P-011** | **Revenue & Payables™** | Purchasing, AP, AR, funding sources, recognition, OIOS events | **Complete** |
| ✅ **P-012** | **FP&A & Financial Reporting** | Statements, budgets, forecasts, variance, dashboards | **Complete** |
| ✅ **P-013** | **JAG CFO™** | Runway, EBITDA, QoE, valuation, scenarios, board, conversational finance | **Complete** |
| ✅ **P-014** | **JAG Knowledge™ & Document Intelligence** | Knowledge graph, docs AI, evidence, search, OCR | **Complete** |
| P-015 | Learning Intelligence™ | Integrate AcademyOS mastery/assessment IP into shared engine | Planned |
| Later | Notification consolidation | Single Notification Engine | Planned |
| Later | Reporting Engine execution | Executable reports across domains | Planned |
| Later | Identity Engine hardening | Unified identity contracts for all industries | Planned |

---

## B. Executive Intelligence Domains

| Domain | Status | Notes |
|--------|--------|-------|
| Mr. JAG™ Help / Academy / Coach | Complete (foundation) | Extend via signals; do not fork |
| Evolution™ | Complete | Feeds Innovation |
| Innovation™ | Complete | Roadmap builders exist |
| Risk Intelligence | Planned | Consume recon/exception/twin signals |
| Performance Intelligence | Planned | Close timeliness, KPI packs |
| Founder Intelligence | Partial (registry tested) | Executive, not domain SoR |

---

## C. Industry Intelligence Domains

| Domain | Status | Notes |
|--------|--------|-------|
| **Education / AcademyOS** | Active (pack + app + legacy) | See section D |
| Healthcare Intelligence | Missing | Future industry pack |
| Nonprofit Intelligence | Partial hooks | Org governance profiles; pack later |
| Future domains | Deferred | Marketplace / pack pattern |

---

## D. AcademyOS roadmap (education)

Sequenced **after** shared engines exist for overlapping concerns. Pedagogy IP is already designed — implementation integrates, not rediscovers.

| Wave | Focus | Depends on | Status |
|------|-------|------------|--------|
| **E0** | Protect IP & map domains (this sprint) | — | ✅ P-010A |
| **E1** | SIS core polish (students/families already production-ready) | Identity, Org | Partial → complete |
| **E2** | Admissions + scholarships to production-ready | Workflow, Docs, Notifications | Building |
| **E3** | Scheduling + attendance + teacher workspace | Calendar | Building / Partial |
| **E4** | Learning runtime: curriculum, mastery, gradebook wired to P-015 | **P-015** | Designed > runtime |
| **E5** | SPED: IEP/504/therapy workflows | Docs, Workflow | Partial / Missing workflows |
| **E6** | Education finance adapters on Shared Finance | **P-011+** | Partial (pack billing) |
| **E7** | Compliance / state reporting packs | Reporting Engine | Missing |
| **E8** | Connectors (SIS/LMS/SSO/payments) | Connector framework | Catalog / stubs |
| **E9** | Mobile native | Stable portal APIs | Deferred |

---

## E. Explicit stop / do-not rules (carry forward)

| Do not | Why |
|--------|-----|
| Rebuild mastery/literacy from scratch in P-015 | IP already in blueprints + pack |
| Build AI CFO inside AcademyOS | Belongs in P-013 Shared Finance |
| Put school gradebook rules into platform core | Education Domain |
| Fork Finance for tuition GL | Education consumes Shared Finance |
| Start Healthcare pack before Shared Identity/Org/Finance stabilize | Platform first |

---

## F. Resume feature development order

After P-014:

1. **P-015** — Learning Intelligence™ (integrate existing AcademyOS mastery & assessment work)
