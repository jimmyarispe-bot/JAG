# 05 — Education Intelligence Planner

**Program D2.5 — Intelligent Contributor Selection**  
**Package:** `src/lib/domains/education/cognition/planner`

---

## 1. Purpose

Decide **which** Education cognitive contributors should run for a given Intent + Context, in what **order**, with what **dependencies** — without executing reasoning.

---

## 2. Planning model

```text
RuntimeIntent + Education Context + Contributor Catalog
        ↓
Contributor Selector (include / skip + reasons)
        ↓
Dependency Graph (requires edges from dependsOn)
        ↓
Topological stages / ordered list
        ↓
Plan Validator
        ↓
EducationPlanResult → host executes contributors → Intelligence Graph
```

---

## 3. Selection examples

| Intent | Plan |
|--------|------|
| Enroll Student (`education.enroll`) | Enrollment only |
| Attendance Review | Attendance only |
| Student Success Review | Enrollment → Attendance → Progress → Intervention |
| Scholarship Review | Enrollment → Scholarship |
| Support | Attendance → Intervention |

Unavailable future contributors are **skipped** with reasons; available dependencies still run.

---

## 4. Dependencies

Descriptors declare `dependsOn` contributor ids.

- Scholarship → Enrollment  
- Intervention → Attendance **or** Progress (`normalizeCatalogDependencies` prefers whichever is available)

Validator fails the plan when a scheduled contributor’s required dependency is missing/unscheduled.

---

## 5. Optimization

Contributors that cannot affect the requested intent are skipped. Context `focusTags` / `focusHints` may add related contributors but do not force unrelated ones.

---

## 6. Execution model (host)

1. `planner.plan({ intent, context })`  
2. For each id in `plan.orderedContributorIds`, run that contributor  
3. Pass results into `createEducationIntelligenceGraph().evaluateResults(...)`  

The Graph and individual contributors remain unchanged.

---

## 7. Extensibility

Add future contributors to `createDefaultEducationContributorCatalog()` with:

- `nodeKind`  
- `capabilities` / `intentMatchers`  
- `dependsOn`  
- `available`  

No Core / Runtime / Domain SDK changes required.
