# 01 — Complete Capability Master List

**Nothing omitted by domain.** Surfaces: Pack (`packages/academyos`), App (`src/applications/academyos`), Legacy (`src/lib/*`), UI (`src/app/*`), API (`src/app/api/academyos`), Shared (`packages/platform/*`), Docs/Blueprints.

Legend: **C** = Complete/production-ready · **P** = Partial · **B** = Building · **D** = Designed (docs/IP) · **S** = Shared engine owns · **E** = Education domain owns

---

## 1. Public & marketing

| Capability | Status | Surfaces | Notes |
|------------|--------|----------|-------|
| Marketing home / brand | P | `(marketing)/` | Route group; root `/` → login historically |
| About / Overview / Pricing / Products / Solutions | P | `(marketing)/` | Industry solution pages |
| Contact / Start / Start success | P | `(marketing)/` | Lead capture |
| Public apply entry | B | `/apply/**` | Admissions funnel |

## 2. Admissions, CRM & enrollment

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Interest / inquiry forms | B | Admissions pack + forms | E |
| CRM pipeline (families/prospects) | B | Admissions pack + `src/lib/admissions` | E |
| Applications | B | Apply portal + admissions API | E |
| Admissions cases / stages | B | Pack + dashboard admissions | E |
| Assessment scheduler | P/D | Admissions docs + automation | E |
| Interview scheduler | P/D | Admissions workflows | E |
| Enrollment / registration | B | Pack enrollment + workflows | E |
| Enrollment packet / documents | B | Admissions docs → **Knowledge** | E + S |
| Acceptance / handoff | B | Admissions handoff actions | E |
| Contracts + e-signature hooks | P | Workforce contracts + admissions | E + S (Knowledge, Workflow) |
| Scholarship portal / applications | B | Scholarships pack + dashboard | E |
| Financial aid / ESA / voucher / district / Medicaid funding | P | Revenue funding presets (P-011) + edu billing | E on **Finance** |

## 3. Student information system

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Students | C | SIS pack, `src/lib/students`, dashboard | E |
| Families / guardians | C | SIS + `src/lib/families` | E |
| Schools / campuses / programs | P | Pack schools + admin campuses/programs | E + Org |
| Classes / classrooms / sections | P | Academic-ops + classrooms | E |
| Student timeline | P | API student-timeline | E + Twin |
| Import students | P | Dashboard students/import | E |

## 4. Attendance, scheduling & calendar

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Attendance | B | Pack attendance + dashboard/teacher | E |
| Scheduling / sessions | B | Pack academic-ops + scheduling lib | E |
| School / program calendars | P | Calendar module + dashboard/calendar | S calendar + E |
| Bell schedules | P | Pack calendars | E |

## 5. Learning, mastery & assessment

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Curriculum | P/D | Pack learning + API | E → **P-015** shared LI |
| Mastery learning | D/P | Pack mastery + blueprints | **P-015** + E UX |
| Gradebook | P | Pack grading | E |
| Assessments | P/D | Pack + blueprints | **P-015** + E |
| Progress monitoring | P | Learning profile + portal progress | E + **P-015** |
| Learning plans / profiles | P/D | Pack + blueprints | Knowledge profile + E |
| Interventions / RTI / MTSS | P/D | Pack interventions + blueprints | **P-015** + E workflows |
| Structured literacy / progressions | D | Blueprints + ULR | **P-015** / Knowledge |
| Digital portfolio | P | Portal portfolio | E |
| Transcripts | P | Pack transcripts | E |

## 6. Special education & therapy

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| IEP | P | Pack iep + support-plans | E (docs via Knowledge) |
| 504 | P | Support-plan kinds | E |
| RTI / MTSS workflows | P/D | Interventions; workflow sparse | E + Workflow |
| FBA / BIP artifacts | D | Knowledge type presets + SPED docs | E + Knowledge |
| Therapy services | P | Support-plans “Therapy” | E |
| Medical documentation / vision / hearing | P/D | Forms + Knowledge types | E + Knowledge |

## 7. Communications

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Messaging | C/P | Pack communications + portal messages | BOTH → Shared Notification |
| Announcements / templates | P | Dashboard communications | BOTH |
| Notifications | C/P | Pack engine + platform | BOTH → consolidate |
| Parent communication platform | P | `src/lib/platform/parent-communication` | S + E |
| Conferences | P | Portal conferences | E |

## 8. Portals & workspaces

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Parent portal | P | `/portal/**`, academyos/parent | E |
| Student portal / workspace | P | `/portal/student*` | E |
| Teacher workspace | B | Dashboard teacher + API teacher-workspace | E |
| School leader workspace | P | Dashboard students/families/admissions/KPIs | E + Exec |
| District / multi-campus | P | Admin campuses + Org | Org + E |
| Executive / founder workspace | P | Dashboard executive, founder, mission-control | Shared EI |
| AcademyOS thin shells | P | `/academyos/parent`, `/academyos/admissions` | E |

## 9. HR & workforce

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Recruiting / applicants | P | Hiring workflow + HR dashboard | E workforce patterns |
| Employees / positions / assignments | P | Pack workforce | E |
| Substitutes | P | Pack + API | E |
| Evaluations / performance | P | Pack performance | E |
| Training / certifications | P | Pack + certification dashboard | E |
| Background checks (docs) | D | Knowledge HR types | Knowledge + E |
| Disciplinary docs | D | Knowledge HR types | Knowledge + E |
| Timesheets / payroll | P | Pack workforce + API | E on shared patterns |
| Contracts (employment) | P | Pack contracts | E + Knowledge |

## 10. Finance (education + shared)

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Family accounts / tuition | P | Pack finance + portal finance | E on **FinanceEngine** |
| Invoices / payments / billing | P | Pack + API | E → Shared Revenue |
| Scholarships | B | Pack + dashboard | E |
| Banking / treasury / recon | C | `packages/platform/finance` | **S** |
| AP / AR / purchasing | C | Revenue + Payables engines | **S** |
| FP&A / statements / variance | C | FinancialReporting + Planning | **S** |
| CFO reasoning | C | `packages/platform/cfo` | **S** |
| Board financial packs | C/P | CFO board + executive board UI | **S** + EI |
| Payroll documents | P | Workforce + Knowledge types | E + Knowledge |

## 11. Documents, knowledge & evidence

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Document upload / library | P | Dashboard documents + admissions docs | → **KnowledgeEngine** |
| OCR / classification / NER | C | KnowledgeEngine (P-014) | **S** |
| Evidence facts / citations | C | KnowledgeEngine | **S** |
| Knowledge graph | C | KnowledgeEngine (+ unified KG libs) | **S** |
| Evidence Center (product) | P | `src/lib/evidence-center` | Integrate with Knowledge |
| Organizational Memory | P | Memory services + engine sinks | **S** |
| Digital Twin | P | Platform twin + AOS twin | **S** + E projections |

## 12. AI, intelligence & analytics

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Mr. JAG Help / Academy / Coach | C | `packages/platform/mr-jag` | **S** |
| Evolution / Innovation | C | Platform packages | **S** |
| Executive KPIs / scenarios / risk UI | P | Dashboard executive/** | EI + CFO |
| Learning analytics | D | Blueprints | **P-015** |
| AI teaching assistant | D | Blueprints; do not fork CFO | Coach + LI |
| Conversational finance | C | CFO assistant | **S** |

## 13. Compliance, reporting & ops

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Compliance / deadlines | P | `src/lib/compliance`, dashboard | E + Workflow |
| School / state reporting | D | Thin | Future Reporting Engine + E packs |
| Workflow runtime | C | Platform Workflow Framework | **S** |
| Platform diagnostics / release | P | Dashboard platform/executive/release | **S** |
| Connectors / integrations | P | Catalog + stubs | Shared connectors + E |
| Hardening / validation / RC ops | P | Pack + API | E ops |

## 14. Identity & organization

| Capability | Status | Surfaces | Owner |
|------------|--------|----------|-------|
| Auth / MFA / invite / reset | C | Platform identity | **S** |
| Roles / permissions | C | Identity + AOS role packs | **S** + E packs |
| Universal Organization Model | C | OrganizationEngine | **S** |
| Multi-entity / campuses | P | Org + admin | **S** + E |

---

## Cross-reference

Detailed pack inventory: `docs/platform/domain-integration/01_ACADEMYOS_INVENTORY.md`  
Crosswalk classifications: `docs/platform/domain-integration/02_CAPABILITY_CROSSWALK.md`  
Engine ownership: [07_ENGINE_MAPPING](./07_ENGINE_MAPPING.md)
