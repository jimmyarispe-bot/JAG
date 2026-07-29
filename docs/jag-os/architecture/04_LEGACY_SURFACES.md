# 04 — Legacy Experience Surfaces

**Phase Ω-0** · Classification: **LEGACY EXPERIENCE SURFACE**  
**Authority:** Constitution Law 2 & 10  
**Rule:** These are **not applications**. They are temporary **context definitions**.

---

## 1. Mapping table — today’s surface → future JAG context

| Current surface | Routes (representative) | Lib / experience home | Future context definition | Domain pack inputs | Core engines consumed |
|-----------------|-------------------------|----------------------|---------------------------|--------------------|------------------------|
| Parent experience | `/portal/**` (non-student) | `src/lib/portal/experience` | **JAG → Parent / Family Context** | Education (SIS, learning views, tuition adapters) | Identity, Knowledge, Finance, Comms, Memory, Twin |
| Student experience | `/portal/student/**` | `src/lib/portal/student-experience` | **JAG → Student / Learner Context** | Education learning, scheduling | Identity, LI facade, Knowledge, Scheduling |
| Apply / applicant | `/apply/portal/**` | Admissions experience | **JAG → Applicant Context** | Education admissions | Identity, Workflow, Knowledge, Finance |
| Teacher workspace | `/dashboard/teacher/**` | `src/lib/teacher/experience` | **JAG → Teacher Context** | Education academic-ops, learning, workforce | Scheduling, LI, Knowledge, Comms, Finance (timesheets) |
| School Leader workspace | `/dashboard/school-leader/**` | `src/lib/school-leader/experience` | **JAG → School Leader Context** | Education ops + admissions metrics | Org, Scheduling, Compliance, Finance, LI, HR |
| Executive workspace | `/dashboard/executive/**` | `src/lib/executive/experience` | **JAG → Executive Context** | Education network metrics + Core EI | Org, Finance, CFO, Innovation, Strategy, Twin, Memory |
| Admissions staff | `/dashboard/admissions/**` | `src/lib/admissions/experience` | **JAG → Admissions Context** | Education admissions | Workflow, Knowledge, Finance, Identity |
| Finance staff UX | `/dashboard/finance/**` | `src/lib/finance*`, finance-platform | **JAG → Finance Context** | Education billing adapters | FinanceEngine, CFO, Revenue |
| HR / Employee | `/dashboard/hr/**`, `/dashboard/employee` | `src/lib/hr`, hr-platform | **JAG → Workforce Context** | Education workforce specialization | Identity, Knowledge, Workflow |
| SIS ops | `/dashboard/students`, `/dashboard/families` | `src/lib/students`, families | **JAG → Registrar / SIS Context** | Education SIS | Identity, Org, Knowledge |
| Founder / CEO | `/dashboard/founder`, `/dashboard/ceo`, `/founder`, `/exec` | founder-intelligence, platform founder | **JAG → Steward / Founder Context** | — (platform stewardship) | Org, EI, Twin, Memory, Evolution |
| Network multi-school | `/dashboard/network/**` | executive network | **JAG → Network Context** | Education multi-campus | Org, Reporting, Finance |
| Mission Control / Platform admin | `/dashboard/mission-control`, `/dashboard/admin/**`, `/dashboard/platform/**` | platform diagnostics | **JAG → Platform Ops Context** | — | Automation, Diagnostics, IAM |
| JAG OS shell (emerging) | `/jag/(portal)/**` | `src/jag/*` | **JAG → Adaptive OS Entry** *(target)* | All enabled domain packs | All Core |
| AcademyOS hosted dashboards | `src/applications/academyos/dashboards|ui|workspace` | application UI packs | Absorb into contexts above | Education | Core |

---

## 2. Per-surface constitutional classification card

### Parent / Student / Apply

| Field | Value |
|-------|-------|
| Classification | **LEGACY EXPERIENCE SURFACE** |
| Core? | NO |
| Outside education? | NO (education family UX) |
| Domain-specific? | YES (presentation over Education) |
| Presentation only? | YES (should be) |
| Violate? | YES — framed as “portal product” |
| Duplicate? | Partial — messaging/docs/billing should only soft-read Core |
| Future | Parent / Student / Applicant Contexts via Orchestrator |

### Teacher / School Leader / Executive / Admissions

| Field | Value |
|-------|-------|
| Classification | **LEGACY EXPERIENCE SURFACE** |
| Violate? | YES — Law 2 (portal/workspace as product mental model); Wave 1.x shipped as product experiences |
| Future | Teacher / School Leader / Executive / Admissions Contexts |
| Note | Orchestration libs under `*/experience` are salvageable composition patterns |

### Finance / HR dashboards

| Field | Value |
|-------|-------|
| Classification | **LEGACY EXPERIENCE SURFACE** |
| Future | Finance Context · Workforce Context |
| Note | Engines stay Core; UX is composition |

---

## 3. Absorption rules (for later phases — not Ω-0)

1. Do not add new role portals.  
2. Do not expand Wave-style “complete workspace” as products.  
3. When Orchestrator ships: register each legacy route as a **context profile** (role + intent + widget set + deep links).  
4. Keep deep links into domain workflows only when the OS cannot resolve automatically (Law 3).  
5. Rename mental model: `Teacher Portal` → `Teacher Context` in docs and nav labels over time.

---

## 4. Inventory of Wave experience commits (historical)

| Wave | Commit theme | Legacy surface |
|------|--------------|----------------|
| 1.1 Admissions | Admissions experience | Admissions Context |
| 1.2 Parent | Parent experience | Parent Context |
| 1.3 Student | Student experience | Student Context |
| 1.4 Teacher | Teacher workspace | Teacher Context |
| 1.5 School Leader | School leader workspace | School Leader Context |
| 1.6 Executive | Executive workspace | Executive Context |

These remain valuable as **compatibility layers** until Orchestrator absorption. They must not define architecture.
