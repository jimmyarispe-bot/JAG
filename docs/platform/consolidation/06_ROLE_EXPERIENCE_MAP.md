# 06 — Role Experience Map

Role packs (education): `src/applications/academyos/permissions/roles.ts`  
Actions: `read` · `create` · `update` · `approve` · `archive` · `export` · `administer`

---

## Role matrix

| Role | Home dashboard | Primary nav | AI features | Notifications | Reports | Documents |
|------|----------------|-------------|-------------|---------------|---------|-----------|
| **Visitor** | Marketing home | Public nav | None | Marketing only | None | Public assets |
| **Prospective parent** | Apply / marketing | Apply, contact | Optional Coach help | Application status | None | Upload application docs |
| **Applicant** | Apply portal | Application, finance, docs | Help | Stage changes | Application status | Application packet |
| **Parent** | `/portal` | Children, learning, attendance, billing, messages, docs, calendar, forms, contracts, support, profile | Coach (scoped) | School + billing | Student progress | Portal documents (Knowledge) |
| **Student** | `/portal/student` | Learning, assignments, assessments, attendance, calendar, goals, achievements, coach, docs, profile, messages | Learning Coach (LI evidence-only) | Assignments / school | Progress | Student documents (Knowledge) |
| **Teacher** | `/dashboard/teacher` | Classes, attendance, progress, lessons, AI assistant, parent comms, documents, timesheets, resources, profile | AI Teaching Assistant (LI evidence-only) | Class / parent | Class reports | Lesson / observations / Knowledge |
| **School leader** | `/dashboard/school-leader` | Enrollment, students, teachers, academics, scheduling, compliance, finance (read-only), HR, communications, reports, profile | Executive + Coach; LI summaries | Ops alerts | School KPIs / reports catalog | School docs |
| **Admissions** | `/dashboard/admissions` | Pipeline, apply review, scholarships | Coach | Pipeline | Admissions funnel | Application docs |
| **Registrar** | Students / enrollment | SIS, enrollment, transcripts | Coach | Enrollment | Rosters | Enrollment docs |
| **Therapist** | Support plans / sessions | IEP/504/therapy, notes | Coach (clinical caution) | Caseload | Therapy progress | Clinical docs (Knowledge) |
| **Finance** | `/dashboard/finance` | AP/AR, tuition, treasury, reporting | **CFO assistant** | Billing / exceptions | Financial statements | Invoices, statements |
| **HR** | `/dashboard/hr` | Employees, hiring, payroll, certs | Coach | HR workflows | Headcount | HR docs (Knowledge) |
| **Executive** | `/dashboard/executive` | Multi-school, academics, operations, finance (read-only), people, strategy, innovation, org intelligence, reports, communications, profile (+ KPIs/board/risk tools) | CFO + Innovation + Strategy + Coach (evidence-only) | Exec briefings | Board packs / reports catalog | Board docs |
| **Board member** | Executive board views | Board, finance highlights | Summaries only | Board packs | Board reports | Minutes / policies |
| **Founder** | `/dashboard/founder` | Org health, priorities, decisions | Full EI + CFO | Critical alerts | Cross-org | Strategic docs |
| **CEO / ED** | Executive + admin | Org, finance, admissions, compliance | Full EI | Critical | Org-wide | Policies |
| **Employee** (generic) | `/dashboard/employee` | Self-service HR | Help | HR | Self | Personal docs |
| **Platform admin** | `/dashboard/admin` | Users, modules, integrations | Ops tools | System | Platform health | System templates |

---

## Permission notes

- Education resources use `academyos.<resource>.<action>` plus `academyos.access` / `academyos.admin`.  
- Shared Finance / CFO / Knowledge APIs use platform session + org gates (`requireFinanceOrg` pattern).  
- **Hide** unauthorized actions; enforce server-side (CRUD standard).  
- Time-limited document shares: KnowledgeEngine permissions / sharing.

---

## AI feature boundaries by role

| Feature | Who | Must not |
|---------|-----|----------|
| Mr. JAG Help / Coach | Most authenticated roles | Modify SoR silently |
| CFO conversational finance | Finance / Executive / Founder | Post journals |
| Knowledge summaries | Roles with doc access | Summarize without evidence |
| Learning AI coach | Teacher (Wave 1.4 assistant) / Student (Wave 1.3 LI coach) | Replace teacher judgment / invent diagnoses |
