# 09 — Backlog Reconciliation

Compare **original AcademyOS intent** vs **current JAG + AcademyOS Education Domain**.

Status key:

| Mark | Meaning |
|------|---------|
| **Completed** | Shipped and usable at intended depth |
| **Integrated** | Exists; correctly owned by shared engine or education domain |
| **Needs Refactor** | Works but must move ownership / remove duplication |
| **Needs Implementation** | Designed / partial; still to build |
| **Deprecated** | Do not invest; schedule removal |
| **Duplicate** | Parallel stack — retire after shared absorption |

---

## A. Shared platform

| Item | Status | Notes |
|------|--------|-------|
| Mr. JAG Help / Academy / Coach | Completed | P-001–004 |
| Evolution™ / Innovation™ | Completed | P-005–006 |
| OrganizationEngine | Completed | P-007 |
| Finance foundation + treasury + recon | Completed | P-008–010 |
| Revenue / Payables | Completed | P-011 |
| FP&A reporting / planning | Completed | P-012 |
| JAG CFO™ | Completed | P-013 |
| KnowledgeEngine | Completed | P-014 |
| Domain integration inventory | Completed | P-010A |
| **This consolidation pack** | Completed | **P-013A** |
| Learning Intelligence | **Completed / Integrated** | **P-015** — facade over AcademyOS learning SoR |
| Notification consolidation | Needs Refactor | BOTH stacks |
| Reporting Engine execution | Needs Implementation | Definitions heavy |
| Identity hardening | Needs Implementation | Later roadmap |
| Risk / Performance intelligence packs | Needs Implementation | EI roadmap |

## B. Education domain (AcademyOS)

| Item | Status | Notes |
|------|--------|-------|
| Students / families SIS | Completed / Integrated | Production-ready registry |
| Communications module | Completed / Needs Refactor | Engine consolidation later |
| Workflow / Forms frameworks usage | Integrated | Definitions registered |
| Admissions pipeline | **Wave 1.1 Experience Complete** | Public site + wizard + CRM orchestration; deepen production polish |
| Scholarships | Needs Implementation | Building |
| Scheduling / attendance / teacher | Needs Implementation | Building / Partial |
| Parent / student portals | Needs Refactor | Partial UX; docs → Knowledge |
| Gradebook / curriculum runtime | Needs Implementation | Designed > runtime |
| Mastery / literacy / interventions IP | **Integrated** (runtime) / Designed (blueprint depth) | LI facade + AcademyOS pack; literacy blueprints remain IP |
| IEP / 504 / therapy workflows | Needs Implementation | Partial SoR; sparse workflows |
| Education billing on Shared Finance | Needs Refactor | Pack billing → Revenue adapters |
| Compliance / state reporting | Needs Implementation | Missing packs |
| Connectors (SIS/LMS/SSO/payments) | Needs Implementation | Catalog / stubs |
| Mobile native | Deprecated (near-term) | Deferred E9 |
| Parallel AcademyOS “OS” narrative | Deprecated | Education Domain of JAG only |

## C. Explicit duplicates

| Duplicate | Action |
|-----------|--------|
| AOS Notification Engine vs platform notifications | Absorb into Shared Notification Engine |
| Multiple document SoRs | All → KnowledgeEngine |
| Tuition GL fork temptation | Forbidden; use FinanceEngine |
| Studio knowledge graph vs org KnowledgeEngine | Keep Studio for engineering graph; org knowledge = KnowledgeEngine |
| AI CFO inside AcademyOS | Forbidden; use CFO package |
| Second workflow runtime | Forbidden |

## D. Reconciliation vs P-010A gap analysis

`docs/platform/domain-integration/07_GAP_ANALYSIS.md` may still mark P-011–014 as Planned. **Authoritative status** is `06_MASTER_ROADMAP.md` + this document: P-011–014 and P-013A are **Complete**. Prefer updating gap docs when next touched; do not fork a third status table.

---

## E. Ordered backlog (post–P-015)

1. Admissions + scholarships → production-ready (Education)  
2. Scheduling + attendance + teacher workspace polish  
3. Education finance adapters fully on Shared Finance/Revenue  
4. SPED workflow density (IEP/504/therapy) on Workflow + Knowledge  
5. Notification consolidation  
6. Reporting Engine execution + education report packs  
7. Connectors  
8. Mobile (deferred)
