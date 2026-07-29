# 04 — Education Intelligence Graph

**Program D2.4 — Cross-Contributor Reasoning**  
**Package:** `src/lib/domains/education/cognition/graph`

---

## 1. Purpose

Coordinate independent Education cognitive contributors into one unified Education cognitive result — without modifying contributors, Core, Runtime, or the Domain SDK.

---

## 2. Graph model

### Nodes

| Kind | Example contributor |
|------|---------------------|
| enrollment | `education.cognition.enrollment` |
| attendance | `education.cognition.attendance` |
| progress | (future) |
| scheduling | (future) |
| intervention | (future) |
| scholarship | (future) |
| compliance | (future) |
| family_engagement | (future) |

Inactive nodes remain in the topology for planning; only nodes with inputs are `active`.

### Edges

Edges represent **influence only** (e.g. attendance → intervention). They do not execute contributors or transfer raw domain objects.

---

## 3. Input contract

The graph accepts **contributor results only**:

- Evidence sets  
- Recommendations  
- Action proposals  
- Confidence / priority / readiness  
- Trace information  

No raw Enrollment/Attendance observations.

---

## 4. Aggregation

| Stream | Behavior |
|--------|----------|
| Evidence | Dedupe by evidence id; record origin contributors |
| Recommendations | Merge duplicates by kind; prioritize |
| Confidence | Average when ready; capped when blocked/conditional |
| Priority | Most urgent among readiness + recommendations |
| Explanations | Unified summary with consulted contributors |
| Traceability | Each recommendation keeps `originContributorIds` + evidence + confidence + priority |
| Action proposals | Merged by `actionId` — never executed |

---

## 5. Conflict resolution

| Situation | Outcome |
|-----------|---------|
| Duplicate recommendation kinds | Merge provenance; keep best priority/confidence |
| Contradictory priorities (same kind) | Flag + keep most urgent |
| Conflicting kinds (e.g. approve vs hold) | Keep higher-severity; suppress loser; record conflict |
| Overlapping evidence ids | Single evidence item; multi-origin provenance |

---

## 6. Traceability

Every graph recommendation identifies:

- Origin contributor(s)  
- Supporting evidence ids  
- Confidence  
- Priority  
- Constitutional trace (preserved / graph-merged)

---

## 7. Independence

Enrollment and Attendance (and future contributors) remain independently runnable. The graph **consumes** their results; it does not replace their reasoning.
