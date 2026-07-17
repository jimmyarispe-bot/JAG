# Workflow Review — Phase D

Static analysis of primary journeys by role. Severity reflects UX risk (not security).

---

## Role workflows

### CEO / Founder
| Goal | Path | Assessment | Findings |
|------|------|------------|----------|
| Morning brief | `/dashboard` → mission control / executive | Partial | Dual surfaces (`/dashboard/executive` vs `/exec`) increase choice paralysis |
| Org health | `/exec/health`, `/exec/brief` | Partial | Phase-2 nav items may 404 or stub |
| Ask / graph | `/exec/ask`, `/exec/graph` | Weak | Graph documented as placeholder in prior audits |
| **Severity** | | | **High** — inconsistent exec IA |

### School leaders / Executive Director
| Goal | Path | Assessment |
|------|------|------------|
| Operating picture | ED dashboard cards (`executive-director-dashboard.ts`) | Logical when permissions set |
| Drill into admissions/SIS/finance | Module sidebar | Efficient if permissions scoped |
| Friction | Overlap with founder widgets when dual-roled | Medium |

### Teachers
| Goal | Path | Assessment |
|------|------|------------|
| Start day’s work | `/dashboard/teacher` | Improving post A.1 (teacher permissions) |
| Session / student | `/dashboard/teacher/sessions/[id]`, `students/[id]` | Reasonable drill-down |
| Friction | Attendance/scheduling jumps across modules | Medium — extra clicks |
| Impact / APIs | Thin product surface | High product gap (prior epic) |

### Parents
| Goal | Path | Assessment |
|------|------|------------|
| Check progress / messages | `/portal/*` | Clear parent nav set |
| Pay / documents | `/portal/finance`, `/portal/documents` | Finance may be simulated (`square_planned`) — trust UX risk |
| Apply | `/apply` → `/apply/portal` | Separate shell from portal — context switch |
| Friction | Long horizontal nav; no native app | High on mobile |

### Students
| Goal | Path | Assessment |
|------|------|------------|
| My day / schedule / goals | `/portal/student/*` | Minimal viable |
| Messages | Limited vs parent | Medium — incomplete peer experience |

### Employees (self-service)
| Goal | Path | Assessment |
|------|------|------------|
| Leave / onboarding | `/dashboard/employee` | Present; form a11y weak |
| Friction | Lives inside staff dashboard chrome | Medium for non-admin staff |

### Admissions staff
| Goal | Path | Assessment |
|------|------|------------|
| Lead → enroll | `/dashboard/admissions` tabs + lead/case detail | Tab/query-param model works but heavy |
| Forms | `LeadForm` etc. | Ad-hoc validation UX (Medium–High a11y) |

### Finance staff
| Goal | Path | Assessment |
|------|------|------------|
| Accounts / transactions | `/dashboard/finance` tabs | Dense tables; export discoverability uneven |
| Family billing | `/dashboard/finance/families/[id]` | Logical entity drill-in |

### HR staff
| Goal | Path | Assessment |
|------|------|------------|
| Employees / leave / payroll UI | `/dashboard/hr` | Tabbed; `HrForms` label wiring gaps |
| Friction | Payroll sensitivity + dense UI | High for errors |

### Special Education staff
| Goal | Path | Assessment |
|------|------|------------|
| Case / IEP / therapy | **No dedicated dashboard SpEd UX found** | **Critical** workflow gap |

---

## Cross-cutting workflow heuristics

| Heuristic | Result |
|-----------|--------|
| Logical order | Mostly OK within modules |
| Efficient (click count) | Founder/platform trees require many hops |
| Consistent | **Fail** across Apply vs Portal vs Dashboard vs Exec shells |
| Unnecessary steps | Dual executive stacks; Phase-2 dead nav |
| Confusing navigation | High for multi-permission users |

---

## Priority workflow findings

| ID | Severity | Finding |
|----|----------|---------|
| WF-01 | Critical | SpEd staff have no dedicated end-to-end UX |
| WF-02 | High | Exec Phase-2 nav items without complete routes |
| WF-03 | High | Dual executive experiences (`/exec` vs `/dashboard/executive`) |
| WF-04 | High | Parent mobile workflows constrained to dense responsive web |
| WF-05 | Medium | Admissions public → authenticated portal shell switch |
| WF-06 | Medium | Teacher attendance/scheduling cross-module hops |
| WF-07 | Medium | Student portal thinner than parent (expectation mismatch) |
