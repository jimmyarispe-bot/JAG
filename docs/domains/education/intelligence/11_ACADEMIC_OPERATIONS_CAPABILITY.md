# 11 — Academic Operations Capability Pack

**Program D5.1 — Third Education Capability Pack**  
**Pack id:** `education.capability_pack.academic_operations`  
**Version:** `0.1.0`  
**Depends on:** Student Lifecycle

---

## 1. Purpose

Optimize operational delivery of instruction through:

1. **Scheduling Intelligence** — conflicts, coverage gaps, optimization  
2. **Staffing Intelligence** — load, qualifications, coverage  
3. **Capacity Intelligence** — utilization, over/under capacity  
4. **Operational Readiness** — synthesis of the above  

No Core / Runtime / Domain SDK changes. No UI. No database. Action proposals only.

---

## 2. Contributors

| Contributor | Id | Kind |
|-------------|----|------|
| Scheduling | `education.cognition.scheduling` | observation |
| Staffing | `education.cognition.staffing` | observation |
| Capacity | `education.cognition.capacity` | observation |
| Operational Readiness | `education.cognition.operational_readiness` | **synthesis** |

---

## 3. Graph

```text
Scheduling ──┐
Staffing ────┼──► Operational Readiness
Capacity ────┘
```

---

## 4. Planner intents

- Daily Operations Review  
- Scheduling Review  
- Staffing Review  
- Capacity Review  
- Semester Planning  
- Leadership Operations Brief  

Scenario: `academic_operations`

---

## 5. Knowledge extensions

Entities: Classroom, Section, Instructional Block, Bell Schedule, Teaching Assignment, Capacity Unit, Instructional Load  

Capabilities: scheduling, staffing, capacity, operational_readiness  

---

## 6. Policy extensions (metadata only)

- Maximum class size  
- Teacher load  
- Program staffing requirements  
- Instructional coverage  
- Session overlap  

Evaluation remains in the Policy Engine only.

---

## 7. Package roots

- `src/lib/domains/education/cognition/scheduling`
- `src/lib/domains/education/cognition/staffing`
- `src/lib/domains/education/cognition/capacity`
- `src/lib/domains/education/cognition/operational-readiness`
