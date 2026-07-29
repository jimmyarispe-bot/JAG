# 004 — Decision Execution & Outcome Tracking

**Sprint:** JAG-004  
**Routes:** `/jag/decisions` · `/jag/decisions/[id]` · overview cards on `/jag`  
**Status:** Complete

---

## 1. Purpose

Extend the Decision Center beyond approval into a full operational command queue:

Assign → Schedule → Track → Measure → Close (with outcome review).

Application metadata only. Contributor logic, JAG Core, and Runtime are unchanged.

---

## 2. Lifecycle

```
New → Reviewing → Approved → Assigned → In Progress → Completed → Outcome Reviewed
```

Side exits remain: `Deferred`, `Dismissed`.

---

## 3. Assignment

Each decision may be assigned to:

- Organization
- Role
- Specific user

Optional due date and execution priority (P1–P3). Assigning moves status to **Assigned**.

---

## 4. Execution tracking

Execution history records:

- Started
- Progress updates (optional %)
- Completion
- Outcome notes
- Evidence added

Started / progress → **In Progress**. Completion → **Completed**.

---

## 5. Outcomes & feedback

Outcome review captures:

- Expected outcome
- Actual outcome
- Confidence
- Success / Failure
- Lessons learned

Feedback (app metadata only — does not retrain contributors):

- Did the decision achieve its intended result?
- Should similar recommendations be prioritized higher or lower in the future?

Recording an outcome moves status to **Outcome Reviewed**.

---

## 6. Executive dashboard cards

On `/jag`:

| Card | Meaning |
|------|---------|
| Open Decisions | Not Completed / Outcome Reviewed / Dismissed |
| Assigned | Assigned or In Progress (or has assignment) |
| Overdue | Open with due date in the past |
| Completed This Week | Completions since Monday UTC |
| Outcome Success Rate | Successes ÷ reviewed outcomes (`—` when none) |

---

## 7. Detail page

`/jag/decisions/[id]` adds:

- Assignment panel
- Execution history + updates
- Outcome review + feedback
- Timeline (status transitions)

---

## 8. Constraints

- UI + application services under `src/lib/jag-command-center/decision-center/`
- No JAG Core / Runtime changes
- No contributor logic changes
- Do not invent decisions without source proposals
