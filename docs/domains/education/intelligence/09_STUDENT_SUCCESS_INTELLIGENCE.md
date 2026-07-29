# 09 — Student Success Intelligence (Synthesis)

**Program D4.1 — First Synthesis Contributor**  
**Package:** `src/lib/domains/education/cognition/student-success`  
**Contributor id:** `education.cognition.student_success`  
**Kind:** `synthesis`

---

## 1. Purpose

Produce an overall student success assessment by **synthesizing upstream contributor outputs** — Enrollment, Attendance, and Academic Progress — plus optional Policy Engine results and Knowledge bindings.

Does **not** duplicate enrollment, attendance, or progress reasoning.

---

## 2. Inputs

`StudentSuccessInputs` assembled from:

| Field | Source |
|-------|--------|
| `enrollment` | `EducationContributorResult` |
| `attendance` | `EducationContributorResult` |
| `progress` | `EducationContributorResult` |
| `policyResult` | optional `EducationPolicyResult` |

Orchestrator builds this via `buildStudentSuccessInputs` after upstream stages complete.

---

## 3. Analysis (examples)

- Healthy learner / positive momentum / outstanding achievement  
- Emerging risk / high academic risk / attendance concern  
- Improving trajectory  
- Conflicting upstream outputs  
- Advancement readiness / intervention need  

---

## 4. Graph

Downstream synthesis node `student_success` influenced by:

- `enrollment` → `student_success`  
- `attendance` → `student_success`  
- `progress` → `student_success`  

---

## 5. Planner

Selected for cross-domain synthesis intents:

- Student Success Review  
- Quarterly Review  
- Advisor Briefing  
- Leadership Brief  

Depends on Enrollment, Attendance, and Academic Progress (staged before synthesis).

---

## 6. Pattern

Reusable synthesis pattern for future domains:

1. Foundational contributors produce results  
2. Synthesis contributor consumes those results only  
3. Graph treats synthesis as a downstream node  
4. Planner selects synthesis only when cross-domain assessment is requested  
