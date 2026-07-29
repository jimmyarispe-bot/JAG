# 10 — Student Support Capability Pack

**Program D4.2 — Second Education Capability Pack**  
**Package roots:**

- `src/lib/domains/education/cognition/intervention`
- `src/lib/domains/education/cognition/family-engagement`
- `src/lib/domains/education/cognition/support-planning`

---

## 1. Purpose

Student Support is the second Education capability pack (after Student Lifecycle foundations: Enrollment, Attendance, Progress, and Student Success synthesis).

It delivers:

1. **Intervention Intelligence** — support strategy candidates from upstream outputs  
2. **Family Engagement Intelligence** — productive family partnership opportunities  
3. **Support Planning** — synthesis that unifies the above into one support plan  

No Core / Runtime / Domain SDK changes. No UI. No database. Action proposals only.

---

## 2. Contributors

| Contributor | Id | Kind | Consumes |
|-------------|----|------|----------|
| Intervention | `education.cognition.intervention` | support | Student Success, Progress, Attendance (+ Knowledge / Policy) |
| Family Engagement | `education.cognition.family_engagement` | support | Student Success, Attendance, Enrollment (+ Knowledge / Policy) |
| Support Planning | `education.cognition.support_planning` | **synthesis** | Intervention, Family Engagement, Student Success |

None of these re-run Enrollment, Attendance, or Progress reasoning.

---

## 3. Graph

```text
Student Success
      │
      ├──► Intervention
      ├──► Family Engagement
      │
      └────────────┐
                   ▼
            Support Planning
                 ▲
                 │
     Intervention ┘
 Family Engagement ┘
```

Edges also retain Attendance/Progress → Intervention influence from earlier phases.

---

## 4. Planner intents

Support scenario selects Intervention, Family Engagement, and Support Planning (dependencies expand transitively):

- Support Review  
- Intervention Planning  
- Family Meeting  
- MTSS Review  
- Student Services  
- Intent id `education.support`

---

## 5. Outputs

### Intervention

- Intervention candidates (type, priority, expected impact)  
- Evidence, recommendations, confidence, priority, explanation  
- Action proposals (create intervention, MTSS review, escalate tier, …)

### Family Engagement

- Engagement opportunities  
- Communication priorities  
- Recommended outreach / meeting proposals  

### Support Planning

- Unified Student Support Plan stance  
- Prioritized actions  
- Expected outcomes  
- Evidence + recommendations + action proposals  

---

## 6. Knowledge bindings

- Capability: `education.capability.interventions` / `education.capability.family_engagement`  
- Entities: student, intervention, family, attendance_record, progress_record, goal  
- Classification: `education.class.intervention_type`  
- Relationship: `education.rel.family_supports_student`
