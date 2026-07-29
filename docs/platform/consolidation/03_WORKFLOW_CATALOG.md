# 03 — Workflow Catalog

**Runtime rule:** All executable workflows use the **platform Workflow Framework**. AcademyOS registers definitions; it does not own a second workflow engine.

Registered definitions source: `src/applications/academyos/workflows/definitions.ts`  
Prior catalog: `docs/applications/academyos/07_WORKFLOW_CATALOG.md`

---

## A. Registered AcademyOS workflows

| Id | Pipeline | Status |
|----|----------|--------|
| `academyos.admissions` | Inquiry → Application → Review → Acceptance → Enrollment | Building |
| `academyos.enrollment` | Draft → Pending → Active | Building |
| `academyos.student-lifecycle` | Enroll → Active → Leave → Graduate → Alumni | Partial |
| `academyos.student-withdrawal` | Requested → Review → Completed | Partial |
| `academyos.hiring` | Applicant → Interview → Offer → Hire → Onboarding | Partial |
| `academyos.hr-lifecycle` | Active → Leave → Separated | Partial |
| `academyos.finance` | Invoice → Billing → Payment → Collections → Closed | Partial (edu) / Shared Revenue |
| `academyos.behavior` | Incident → Review → Action → Resolution | Partial |
| `academyos.scholarship` | Application → Verification → Approval → Funding → Renewal | Building |
| `academyos.payroll-approval` | Draft → Review → Approved | Partial |
| `academyos.incident-review` | Open → Investigating → Closed | Partial |

---

## B. End-to-end business journeys (must be preserved)

| Journey | Steps | Engines |
|---------|-------|---------|
| Interest form | Public form → Inquiry → CRM | Forms, Admissions, Notifications |
| Application | Apply → Docs → Review | Admissions, Knowledge, Workflow |
| Admissions assessment | Schedule → Complete → Score | Admissions, Calendar, Learning |
| Interview | Schedule → Conduct → Decision | Admissions, Calendar, Workflow |
| Acceptance | Offer → Accept → Contract | Admissions, Workflow, Knowledge |
| Signature | Present → Sign hook → Archive | Knowledge, Workflow |
| Registration / enrollment | Packet → Register → Active student | Admissions, SIS, Workflow |
| Document upload | Upload → Classify → Evidence | **KnowledgeEngine** |
| Scheduling | Place → Sections → Calendar | Scheduling, Calendar, Org |
| Attendance | Take → Persist → Notify | Attendance, SIS, Notifications |
| Instruction | Plan → Teach → Observe | Learning, Knowledge, Teacher UX |
| Mastery | Assess → Mastery update → Transcript | **P-015**, Learning, SIS |
| Progress monitoring | Measure → Chart → Intervene | Learning, Knowledge |
| Intervention / RTI / MTSS | Flag → Plan → Deliver → Review | Learning, Workflow (**needs denser defs**) |
| IEP / 504 | Draft → Meeting → Sign → Serve | SPED, Knowledge, Workflow |
| Therapy | Plan → Session notes → Progress | SPED, Knowledge |
| Tuition / billing | Invoice → Pay → Collect | Finance/Revenue, Education billing |
| Scholarship | Apply → Verify → Award → Renew | Scholarships, Finance, Workflow |
| ESA / voucher / grant / district funding | Configure funding → Apply → Recognize | Revenue funding sources (P-011) |
| Payroll | Time → Batch → Approve → Pay | Workforce, Finance patterns |
| Hiring | Recruit → Interview → Offer → Onboard | Workforce, Workflow, Knowledge |
| Performance reviews | Cycle → Evaluate → Acknowledge | Workforce, Workflow |
| Board / CFO pack | Analyze → Recommend → Report | CFO, Finance, Knowledge |
| Legal hold / retention | Policy → Hold → Archive | Knowledge |

---

## C. Gaps (workflows designed but thin/missing)

| Area | Gap | Action |
|------|-----|--------|
| MTSS / RTI explicit pipelines | Sparse vs blueprints | Register Workflow defs; no new engine |
| IEP meeting / consent | Partial support-plans | Education workflows + Knowledge docs |
| Assessment / interview schedulers | Partial admissions automation | Calendar + Workflow |
| E-signature provider | Hook only | Knowledge workflow `signature_hook` |
| Notification consolidation | Dual stacks | Later Notification Engine |

---

## D. Do not create

- A second AcademyOS workflow runtime  
- AI that posts ledger or student SoR changes without workflow gates  
- Education-specific finance GL workflows that bypass FinanceEngine  
