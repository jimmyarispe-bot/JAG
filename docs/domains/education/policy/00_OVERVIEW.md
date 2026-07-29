# 00 — Education Policy Engine Overview

**Program D3.1 — Knowledge → Evaluation**  
**Package:** `src/lib/domains/education/policy`

---

## 1. Purpose

Evaluate Education Knowledge policy definitions against normalized observations.

The engine is independent of contributors, the planner, and the orchestrator.

---

## 2. Boundaries

| Does | Does not |
|------|----------|
| Evaluate metadata-driven policies | Execute actions |
| Emit satisfied / violated / unknown | Produce recommendations |
| Attach evaluation traces + evidence refs | Access databases |
| Validate registry integrity | Migrate Enrollment / Attendance contributors |

---

## 3. Pipeline

```text
Knowledge policy definitions
        +
Normalized policy facts (observations)
        ↓
Education Policy Engine
        ↓
EducationPolicyResult
  (satisfied · violated · unknown · traces)
```

---

## 4. Document index

| Doc | Topic |
|-----|-------|
| [01_ENGINE.md](./01_ENGINE.md) | Engine / registry / evaluators |
| [02_POLICY_RESULTS.md](./02_POLICY_RESULTS.md) | Result shapes |
| [03_TRACEABILITY.md](./03_TRACEABILITY.md) | Traces & evidence |

---

## 5. Related

- Knowledge policies: `docs/domains/education/knowledge/03_POLICIES.md`  
- Capability catalog (reasoning areas): Knowledge D3.0  
