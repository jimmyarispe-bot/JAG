# 08 — Academic Progress Intelligence

**Program D4.0 — First Knowledge-Driven Contributor**  
**Package:** `src/lib/domains/education/cognition/progress`  
**Contributor id:** `education.cognition.progress`

---

## 1. Purpose

Reason about academic progress toward goals, mastery, assessments, and course pacing — producing evidence, recommendations, and action **proposals** only.

This is the first Education cognitive contributor that actively consumes:

1. **Knowledge Model** — entities, relationships, classifications, vocabulary, capability  
2. **Policy Engine** — via `EducationPolicyEvaluationPort` (no embedded policy rules)

---

## 2. Inputs

Normalized `AcademicProgressObservation` (host-supplied):

- Student / Program  
- Learning goals + mastery indicators  
- Assessment summaries  
- Course progress  
- Intervention history  
- Attendance summary (optional context for related policies)  
- Credits earned  

No database access.

---

## 3. Knowledge usage

Evidence includes `knowledge_entities_bound` with:

- `education.capability.academic_progress`  
- Related entity / relationship / classification ids from the Knowledge catalogs  

No duplicated Knowledge definitions inside the contributor.

---

## 4. Policy usage

`analyzeAcademicProgress` calls the Policy Engine with normalized facts:

- Graduation credits (always when evaluating progress)  
- Attendance thresholds when `attendanceSummary` is present  

Policy outcomes become evidence (`policy_*_satisfied|violated|unknown`) and inform recommendations. Policy logic is **not** reimplemented.

---

## 5. Analysis signals (examples)

| Signal | Meaning |
|--------|---------|
| `expected_progress` | On track |
| `ahead_of_expectations` / `exceptional_growth` | Ahead |
| `behind_expectations` / `stalled_progress` | Behind / stalled |
| `insufficient_evidence` | Not enough observation data |
| `assessment_ready` / `assessment_not_ready` | Assessment readiness |
| `intervention_indicated` | Support likely needed |
| `policy_graduation_*` | Policy Engine outcomes |

---

## 6. Outputs

Standard `EducationContributorResult`:

- Evidence + recommendations + confidence + priority  
- Explanations + constitutional traces  
- Action proposals (never executed)

---

## 7. Integration

| Layer | Integration |
|-------|-------------|
| Framework | `defineEducationCognitiveContributor` / pipeline |
| Planner | Catalog entry `available: true`; student success / progress / assess intents |
| Graph | Node kind `progress` via contributor id mapping |
| Orchestrator | `observations.progress` → `runAcademicProgressIntelligence` |
| Domain package | Manifest + builder cognitive registration |

---

## 8. Non-goals

- No Core / Runtime / Domain SDK changes  
- No UI / DB / workflows  
- No Action execution  
