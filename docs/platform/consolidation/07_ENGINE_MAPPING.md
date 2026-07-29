# 07 — Engine Mapping

**Rule:** Every screen and workflow identifies which **canonical engines** power it.  
**Rule:** No duplicated business logic across AcademyOS and Shared Platform.

---

## A. Canonical shared engines (JAG)

| Engine | Package / home | Owns |
|--------|----------------|------|
| Identity Engine | Platform identity | Auth, memberships, roles, MFA, invites |
| OrganizationEngine | `packages/platform/organization` | Org model, governance, strategy, performance |
| FinanceEngine | `packages/platform/finance` | Ledger, COA, journals, multi-entity |
| TreasuryEngine | finance/banking | Banking, cash, transfers |
| ReconciliationEngine | finance/reconciliation | Bank/GL match, close |
| RevenueEngine | finance/revenue | AR, billing, funding sources, recognition |
| PayablesEngine | finance/payables | Purchasing, AP, payments |
| FinancialReportingEngine | finance/reporting | Statements, variance, dashboards, dimensions |
| FinancialPlanningEngine | finance/planning | Budgets, forecasts, scenarios |
| ChiefFinancialOfficerEngine | `packages/platform/cfo` | EBITDA, runway, QoE, valuation, board, recommendations |
| KnowledgeEngine | `packages/platform/knowledge` | Documents, OCR, evidence, graph, search |
| Workflow Framework | Platform workflow | Executable pipelines |
| Forms Framework | Platform forms | Form definitions / validation |
| Mr. JAG™ | `packages/platform/mr-jag` | Help, Academy, Coach |
| Evolution™ | `packages/platform/evolution` | Capture → proposals |
| Innovation™ | `packages/platform/innovation` | Opportunity portfolio |
| Digital Twin | Platform twin services | Projections (industry adapters publish) |
| Evidence Ledger / Memory | Platform + engine sinks | Audit-grade evidence & memory |
| Calendar | Platform calendar module | Shared calendar primitives |
| Notification Engine | **Later consolidation** | Absorb AOS notification engine |

**Planned shared:** Learning Intelligence (P-015), Reporting Engine execution, Notification consolidation, Identity hardening.

---

## B. Education domain (AcademyOS) — consumes shared; owns pedagogy/SIS UX

| Education capability | Owns | Consumes |
|----------------------|------|----------|
| Admissions / CRM | Pipeline, cases, stages | Identity, Workflow, Knowledge, Finance, Twin |
| SIS (students/families) | Student SoR education fields | Identity, Org, Knowledge |
| Scheduling / attendance | School schedules, attendance records | Calendar, Org, Notifications |
| Teacher workspace | Daily UX | Learning, Knowledge, Scheduling, Comms |
| Parent / student portals | Education UX | Knowledge, Finance, Learning, Messaging |
| Gradebook / classes | Education grading rules | Learning Intelligence (P-015) |
| IEP / 504 / therapy | Education SPED SoR | Knowledge (docs), Workflow |
| Scholarships / tuition UX | Education billing adapters | Finance / Revenue |
| Workforce (substitutes, certs) | Education HR specialization | Identity, Knowledge, Workflow |
| School communications templates | Education content | Shared Notification (future) |

---

## C. Screen → engine examples

### Admissions

| Concern | Engine |
|---------|--------|
| Login / roles | Identity |
| Application docs | **KnowledgeEngine** |
| Pipeline stages | Workflow |
| Campus / org | OrganizationEngine |
| Fees / deposits | Finance / Revenue |
| Status projections | Digital Twin |

### Teacher workspace

| Concern | Engine |
|---------|--------|
| Pedagogy / mastery | Learning Intelligence (P-015) + Education UX |
| Lesson artifacts | KnowledgeEngine |
| Org / campus | OrganizationEngine |
| Classes / periods | Scheduling (Education) + Calendar |
| Parent messages | Communications / Notifications |
| Mastery updates | Learning (P-015) |

### Parent portal

| Concern | Engine |
|---------|--------|
| Docs | KnowledgeEngine |
| Progress / mastery views | Learning + SIS |
| Balances / pay | Finance / Revenue |
| Messages | Communications |
| Identity | Identity |

### Student

| Concern | Engine |
|---------|--------|
| Learning / assessments | Learning + Knowledge |
| Mastery / progress | Learning (P-015) |
| Schedule | Scheduling |
| Portfolio | Knowledge + Learning |

### Executive

| Concern | Engine |
|---------|--------|
| Cash / EBITDA / runway | **CFO** |
| Org / strategy / goals | OrganizationEngine |
| Innovation / horizons | InnovationEngine |
| Finance SoR | FinanceEngine |
| Board packs | CFO + Knowledge |

### Finance staff

| Concern | Engine |
|---------|--------|
| Banking | TreasuryEngine |
| AP / AR | Payables / Revenue |
| Statements / budgets | Reporting / Planning |
| Reasoning | CFO (recommend only) |

---

## D. Duplicate elimination map

| Duplicate | Keep | Retire / absorb after |
|-----------|------|------------------------|
| AcademyOS Notification Engine vs platform notifications | Shared Notification Engine | Pack becomes templates adapter |
| Admissions/docs vs dashboard documents vs Knowledge | **KnowledgeEngine** | Point all uploads to Knowledge |
| Education invoice as second ledger | Finance / Revenue | Edu billing = adapter only |
| AOS twin vs platform twin | Shared Digital Twin | Education projections only |
| AI teaching assistant vs Mr. JAG vs CFO | Role-scoped surfaces on shared AI/Coach/CFO | No third “AI OS” |
| Parallel AcademyOS product | Education Domain of JAG | No second installable OS |

---

## E. Anti-patterns (forbidden)

1. Building a parallel AcademyOS platform.  
2. Putting GL / treasury logic in `packages/academyos`.  
3. Education-specific document model outside KnowledgeEngine.  
4. CFO or Learning AI modifying accounting or SIS SoR without workflow.  
5. Rebuilding mastery/literacy IP in P-015 instead of integrating.
